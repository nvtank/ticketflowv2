import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@tixflow/shared';
import { CurrentPrincipal, Public, Roles } from '../auth/auth.decorators';
import type { Principal } from '../auth/auth.types';
import { ContactMessageQueryDto, CreateContactMessageDto } from './contact.dto';
import { ContactService } from './contact.service';

@ApiTags('Contact')
@Controller()
export class ContactController {
  constructor(@Inject(ContactService) private readonly contact: ContactService) {}

  @Public()
  @Post('contact')
  @ApiBody({ type: CreateContactMessageDto })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Header('Cache-Control', 'no-store')
  submit(@Body() input: CreateContactMessageDto) {
    return this.contact.create(input);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/contact-messages')
  @ApiQuery({ type: ContactMessageQueryDto })
  @Header('Cache-Control', 'private, no-store')
  list(@Query() query: ContactMessageQueryDto) {
    return this.contact.list(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/contact-messages/:id')
  markHandled(@Param('id', ParseUUIDPipe) id: string, @CurrentPrincipal() principal: Principal) {
    return this.contact.markHandled(id, principal.user.id);
  }
}
