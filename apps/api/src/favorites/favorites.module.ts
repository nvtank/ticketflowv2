import {
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Module,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentPrincipal } from '../auth/auth.decorators';
import type { Principal } from '../auth/auth.types';
import { PageDto } from '../events/events.dto';
import { FavoritesService } from './favorites.service';

@ApiBearerAuth()
@ApiTags('Favorites')
@Controller('me/favorites')
export class FavoritesController {
  constructor(@Inject(FavoritesService) private readonly favorites: FavoritesService) {}

  @Get()
  @ApiQuery({ type: PageDto })
  @Header('Cache-Control', 'private, no-store')
  list(@CurrentPrincipal() principal: Principal, @Query() query: PageDto) {
    return this.favorites.list(principal.user.id, query);
  }

  @Put(':eventId')
  add(@CurrentPrincipal() principal: Principal, @Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.favorites.add(principal.user.id, eventId);
  }

  @Delete(':eventId')
  remove(
    @CurrentPrincipal() principal: Principal,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.favorites.remove(principal.user.id, eventId);
  }
}

@Module({ controllers: [FavoritesController], providers: [FavoritesService] })
export class FavoritesModule {}
