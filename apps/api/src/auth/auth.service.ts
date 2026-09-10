import { createHash, randomBytes } from 'node:crypto';
import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '@prisma/client';
import type { z } from 'zod';
import type { loginSchema, registerSchema } from '@tf2/shared';
import { ENVIRONMENT, type Environment } from '../config';
import { Database } from '../database';
import { hashPassword, verifyPassword } from './password';

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const publicUser = ({ id, email, name, role }: User) => ({ id, email, name, role });
const day = 86400000;

@Injectable()
export class AuthService {
  private readonly jwt = new JwtService();
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(ENVIRONMENT) private readonly env: Environment,
  ) {}

  private async newRefresh(tx: Prisma.TransactionClient, sessionId: string, expiresAt: Date) {
    const refreshToken = randomBytes(32).toString('base64url');
    const refreshExpiresAt = new Date(Math.min(expiresAt.getTime(), Date.now() + 2 * day));
    await tx.refreshToken.create({
      data: { sessionId, tokenHash: tokenHash(refreshToken), expiresAt: refreshExpiresAt },
    });
    return { refreshToken, refreshExpiresAt };
  }

  private async newSession(tx: Prisma.TransactionClient, user: User) {
    const session = await tx.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + 7 * day) },
    });
    return { user, session, ...(await this.newRefresh(tx, session.id, session.expiresAt)) };
  }

  private async response(result: {
    user: User;
    session: { id: string };
    refreshToken: string;
    refreshExpiresAt: Date;
  }) {
    const accessToken = await this.jwt.signAsync(
      { sid: result.session.id },
      {
        secret: this.env.JWT_SECRET,
        algorithm: 'HS256',
        expiresIn: '15m',
        issuer: 'tf2-api',
        audience: 'tf2-web',
        subject: result.user.id,
      },
    );
    return {
      user: publicUser(result.user),
      accessToken,
      refreshToken: result.refreshToken,
      refreshExpiresAt: result.refreshExpiresAt,
    };
  }

  async register(input: z.infer<typeof registerSchema>) {
    const passwordHash = await hashPassword(input.password);
    try {
      const result = await this.db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: input.email, name: input.name, passwordHash, role: 'CUSTOMER' },
        });
        return this.newSession(tx, user);
      });
      return this.response(result);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(input: z.infer<typeof loginSchema>) {
    const user = await this.db.user.findUnique({ where: { email: input.email } });
    const valid = await verifyPassword(input.password, user?.passwordHash);
    if (!valid || !user?.active) throw new UnauthorizedException('Invalid credentials');
    const result = await this.db.$transaction(async (tx) => {
      // Serialize with account changes so stale credentials cannot establish a new session.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`;
      const current = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!current.active || current.passwordHash !== user.passwordHash)
        throw new UnauthorizedException('Invalid credentials');
      return this.newSession(tx, current);
    });
    return this.response(result);
  }

  async refresh(value: string) {
    const hash = tokenHash(value);
    const found = await this.db.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!found) throw new UnauthorizedException('Invalid session');
    const result = await this.db.$transaction(async (tx) => {
      // Stable lock: old and replacement token requests share this same session row.
      await tx.$queryRaw`SELECT "id" FROM "Session" WHERE "id" = ${found.sessionId}::uuid FOR UPDATE`;
      const token = await tx.refreshToken.findUnique({
        where: { tokenHash: hash },
        include: { session: { include: { user: true } } },
      });
      const now = new Date();
      if (
        !token ||
        token.session.revokedAt ||
        token.session.expiresAt <= now ||
        !token.session.user.active
      )
        return null;
      if (token.consumedAt || token.expiresAt <= now) {
        await tx.session.update({ where: { id: token.sessionId }, data: { revokedAt: now } });
        // Commit revocation before the outer method throws 401.
        return null;
      }
      await tx.refreshToken.update({ where: { id: token.id }, data: { consumedAt: now } });
      return {
        user: token.session.user,
        session: token.session,
        ...(await this.newRefresh(tx, token.sessionId, token.session.expiresAt)),
      };
    });
    if (!result) throw new UnauthorizedException('Invalid session');
    return this.response(result);
  }

  async authenticate(accessToken: string) {
    let claims: { sub: string; sid: string };
    try {
      claims = await this.jwt.verifyAsync<{ sub: string; sid: string }>(accessToken, {
        secret: this.env.JWT_SECRET,
        algorithms: ['HS256'],
        issuer: 'tf2-api',
        audience: 'tf2-web',
      });
      if (
        ![claims.sub, claims.sid].every(
          (value) => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value),
        )
      )
        throw new Error('Invalid claims');
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
    const session = await this.db.session.findUnique({
      where: { id: claims.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== claims.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.active
    )
      throw new UnauthorizedException('Invalid session');
    return { user: publicUser(session.user), sessionId: session.id };
  }

  async logout(refreshToken?: string, accessToken?: string) {
    let sessionId: string | undefined;
    if (refreshToken) {
      const token = await this.db.refreshToken.findUnique({
        where: { tokenHash: tokenHash(refreshToken) },
      });
      sessionId = token?.sessionId;
    }
    if (!sessionId && accessToken) {
      try {
        sessionId = (await this.authenticate(accessToken)).sessionId;
      } catch (error) {
        if (!(error instanceof UnauthorizedException)) throw error;
      }
    }
    if (sessionId)
      await this.db.session.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }
}
