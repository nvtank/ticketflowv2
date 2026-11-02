import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { loginSchema, registerSchema } from '@tf2/shared';
import { z } from 'zod';
import { ENVIRONMENT, type Environment } from '../config';
import { Database } from '../database';
import { AuthService } from './auth.service';

export function bearer(request: Request) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
  return header.slice(7);
}

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException('Invalid request');
  return result.data;
}

const refreshCookie = (req: Request): string | undefined => {
  const candidate: unknown = req.cookies?.tf2_refresh;
  return typeof candidate === 'string' && candidate.length <= 256 ? candidate : undefined;
};

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ENVIRONMENT) private readonly env: Environment,
  ) {}

  private origin(request: Request) {
    if (request.headers.origin !== this.env.WEB_ORIGIN)
      throw new ForbiddenException('Origin not allowed');
  }

  private options() {
    return {
      httpOnly: true,
      secure: this.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/api/v1/auth',
    };
  }

  private send(res: Response, result: Awaited<ReturnType<AuthService['register']>>) {
    res.cookie('tf2_refresh', result.refreshToken, {
      ...this.options(),
      expires: result.refreshExpiresAt,
    });
    res.setHeader('Cache-Control', 'no-store');
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('register')
  async register(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    return this.send(res, await this.auth.register(parse(registerSchema, body)));
  }

  @Post('login')
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.origin(req);
    return this.send(res, await this.auth.login(parse(loginSchema, body)));
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.origin(req);
    const value = refreshCookie(req);
    if (!value) throw new UnauthorizedException('Refresh cookie required');
    return this.send(res, await this.auth.refresh(value));
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.origin(req);
    const access = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    await this.auth.logout(refreshCookie(req), access);
    res.clearCookie('tf2_refresh', this.options());
    return { status: 'ok' };
  }

  @Get('me')
  async me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return (await this.auth.authenticate(bearer(req))).user;
  }
}

@Controller('organizations')
export class OrganizationController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(Database) private readonly db: Database,
  ) {}

  @Get(':id/context')
  async context(@Param('id') input: string, @Req() req: Request) {
    const id = parse(z.uuid(), input);
    const { user } = await this.auth.authenticate(bearer(req));
    const membership = await this.db.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: id } },
    });
    if (!membership || !['ORGANIZER', 'STAFF'].includes(membership.role))
      throw new ForbiddenException('Organization access denied');
    return { organizationId: id, role: membership.role };
  }
}
