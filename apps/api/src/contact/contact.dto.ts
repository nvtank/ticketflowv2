import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ContactMessageStatus, ContactTopic } from '../generated/prisma/client';
import { PageDto } from '../events/events.dto';

export class CreateContactMessageDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsEnum(ContactTopic)
  topic!: ContactTopic;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class ContactMessageQueryDto extends PageDto {
  @IsOptional()
  @IsEnum(ContactMessageStatus)
  status?: ContactMessageStatus;
}
