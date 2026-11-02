import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { eventInputSchema, eventReviewSchema } from '@tf2/shared';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { bearer, parse } from '../auth/auth.controller';
import { EventsService } from './events.service';

const uuid = (value: string) => parse(z.uuid(), value);

@Controller('organizations/:organizationId/events')
export class OrganizerEventsController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(EventsService) private readonly events: EventsService,
  ) {}

  private async actor(req: Request) {
    return (await this.auth.authenticate(bearer(req))).user;
  }

  @Post()
  async create(@Param('organizationId') org: string, @Body() body: unknown, @Req() req: Request) {
    return this.events.create(await this.actor(req), uuid(org), parse(eventInputSchema, body));
  }

  @Get()
  async list(@Param('organizationId') org: string, @Req() req: Request) {
    return this.events.listOwn(await this.actor(req), uuid(org));
  }

  @Patch(':id')
  async update(
    @Param('organizationId') org: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.events.update(
      await this.actor(req),
      uuid(org),
      uuid(id),
      parse(eventInputSchema, body),
    );
  }

  @Post(':id/submit')
  async submit(@Param('organizationId') org: string, @Param('id') id: string, @Req() req: Request) {
    return this.events.submit(await this.actor(req), uuid(org), uuid(id));
  }

  @Delete(':id')
  async remove(@Param('organizationId') org: string, @Param('id') id: string, @Req() req: Request) {
    return this.events.remove(await this.actor(req), uuid(org), uuid(id));
  }
}

@Controller('admin/events')
export class AdminEventsController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(EventsService) private readonly events: EventsService,
  ) {}

  @Get()
  async pending(@Req() req: Request) {
    return this.events.pending((await this.auth.authenticate(bearer(req))).user);
  }

  @Post(':id/review')
  async review(@Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    return this.events.review(
      (await this.auth.authenticate(bearer(req))).user,
      uuid(id),
      parse(eventReviewSchema, body),
    );
  }
}

@Controller('events')
export class PublicEventsController {
  constructor(@Inject(EventsService) private readonly events: EventsService) {}

  @Get()
  catalog(@Query('q') q: unknown) {
    return this.events.catalog(parse(z.string().trim().max(100).default(''), q));
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.events.detail(uuid(id));
  }
}
