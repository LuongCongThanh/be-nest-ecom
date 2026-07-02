import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class ShippingAddressDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  recipient!: string;

  @ApiProperty({ example: '0900000000' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '123 Le Loi' })
  @IsString()
  line1!: string;

  @ApiPropertyOptional({ example: 'Floor 2' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Ben Nghe' })
  @IsString()
  ward!: string;

  @ApiProperty({ example: 'District 1' })
  @IsString()
  district!: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  province!: string;

  @ApiPropertyOptional({ example: '700000' })
  @IsOptional()
  @IsString()
  postcode?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ApiProperty({ example: 'standard', enum: ['standard'], description: 'Only flat "standard" rate in MVP — dynamic shipping calc is TASK-225' })
  @IsIn(['standard'])
  shippingMethod!: string;

  @ApiProperty({ example: 'vnpay', description: 'Provider name only — actual payment processing is TASK-221' })
  @IsString()
  paymentProvider!: string;

  @ApiProperty({ example: 'a1b2c3d4-...', description: 'Client-generated UUID. Replaying the same key returns the original Order instead of creating a duplicate.' })
  @IsUUID()
  idempotencyKey!: string;
}
