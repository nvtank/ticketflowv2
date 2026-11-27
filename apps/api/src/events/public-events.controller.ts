import { Controller, Get, Header, Inject, Param, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OptionalAuth, Public } from '../auth/auth.decorators';
import type { AuthRequest } from '../auth/auth.types';
import { PublicEventsService } from './public-events.service';
import { EventFiltersResponseDto, EventQueryDto } from './events.dto';
@ApiTags('Public events')
@Public()
@Controller('events')
export class PublicEventsController {
  constructor(@Inject(PublicEventsService) private readonly events: PublicEventsService) {}
  @ApiQuery({ type: EventQueryDto })
  @Get()
  @ApiOperation({
    summary: 'List published upcoming events; price filters apply to the lowest ticket price',
  })
  list(@Query() query: EventQueryDto) {
    return this.events.list(query);
  }
  @Get('filters')
  @ApiOperation({
    summary: 'List available cities and price bounds of published upcoming events',
  })
  @ApiOkResponse({ type: EventFiltersResponseDto })
  filters() {
    return this.events.filters();
  }
  @Get(':key/seats') seats(@Param('key') key: string) {
    return this.events.seats(key);
  }
  @Get(':key/inventory') inventory(@Param('key') key: string) {
    return this.events.inventory(key);
  }
  @Get(':key')
  @OptionalAuth()
  @Header('Cache-Control', 'private, no-store')
  detail(@Param('key') key: string, @Req() request: AuthRequest) {
    return this.events.detail(key, request.principal?.user.id);
  }
}
