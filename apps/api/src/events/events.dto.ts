import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { EVENT_CATEGORIES, EVENT_SORT_OPTIONS } from '@tixflow/shared';

const ALLOWED_EVENT_SORTS = [...EVENT_SORT_OPTIONS, 'date'] as const;
export type EventQuerySort = (typeof ALLOWED_EVENT_SORTS)[number];

@ValidatorConstraint({ name: 'eventQueryRange', async: false })
class EventQueryRangeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const query = args.object as EventQueryDto;
    if (query.from && query.to) {
      const fromTime = new Date(query.from).getTime();
      const toTime = new Date(query.to).getTime();
      if (Number.isFinite(fromTime) && Number.isFinite(toTime) && fromTime > toTime) {
        return false;
      }
    }
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(): string {
    return 'Khoảng ngày (from <= to) hoặc khoảng giá (minPrice <= maxPrice) không hợp lệ.';
  }
}

export class PageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 12;
}
export class EventQueryDto extends PageDto {
  @ApiPropertyOptional({ description: 'Search keyword matched against event title' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: EVENT_CATEGORIES })
  @IsOptional()
  @IsIn(EVENT_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ description: 'Venue city filter (case-insensitive)' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Minimum event start date/time (ISO-8601)' })
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @ApiPropertyOptional({ description: 'Maximum event start date/time (ISO-8601)' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Validate(EventQueryRangeConstraint)
  to?: string;

  @ApiPropertyOptional({ description: 'Minimum lowest ticket price in VND', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum lowest ticket price in VND', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  @Validate(EventQueryRangeConstraint)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: EVENT_SORT_OPTIONS,
    default: 'soonest',
    description: 'Sort order for catalog results',
  })
  @IsOptional()
  @IsIn(ALLOWED_EVENT_SORTS)
  sort: EventQuerySort = 'soonest';
}

export class EventFiltersResponseDto {
  @ApiProperty({ type: [String], example: ['Đà Nẵng', 'Hà Nội', 'Hồ Chí Minh'] })
  cities!: string[];

  @ApiProperty({ example: 150000 })
  minPriceVnd!: number;

  @ApiProperty({ example: 2500000 })
  maxPriceVnd!: number;
}

export class OrganizerQueryDto extends PageDto {
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'COMPLETED'])
  status?: string;
}
export class VenueDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;
  @IsString() @MinLength(3) @MaxLength(500) address!: string;
  @IsString() @MinLength(2) @MaxLength(100) city!: string;
}
export class EventDatesDto {
  @IsISO8601({ strict: true }) startsAt!: string;
  @IsISO8601({ strict: true }) endsAt!: string;
  @IsISO8601({ strict: true }) salesStartAt!: string;
  @IsISO8601({ strict: true }) salesEndAt!: string;
}
export class EventFieldsDto extends EventDatesDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;
  @IsString() @MinLength(20) @MaxLength(20000) description!: string;
  @IsIn(EVENT_CATEGORIES) category!: string;
  @IsDefined() @ValidateNested() @Type(() => VenueDto) venue!: VenueDto;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  coverUrl?: string | null;
  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { each: true },
  )
  galleryUrls: string[] = [];
  @IsString() @MinLength(10) @MaxLength(5000) ticketPolicy!: string;
  @IsInt() @Min(1) @Max(10) maxTicketsPerOrder = 4;
}
export class CreateEventDto extends EventFieldsDto {
  @IsUUID() organizationId!: string;
}
export class SectionDto {
  @IsString() @MinLength(1) @MaxLength(60) name!: string;
  @IsString() @MinLength(1) @MaxLength(60) ticketName!: string;
  @IsInt() @Min(0) @Max(100000000) priceVnd!: number;
  @IsInt() @Min(1) @Max(26) rows!: number;
  @IsInt() @Min(1) @Max(40) columns!: number;
}
export class GridDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections!: SectionDto[];
}
export class SeatEnabledDto {
  @IsBoolean() enabled!: boolean;
}
export class RejectEventDto {
  @IsString() @MinLength(5) @MaxLength(1000) reason!: string;
}
export class AssignStaffDto {
  @IsString() @MinLength(5) @MaxLength(254) email!: string;
}
