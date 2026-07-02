import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength, Min, ValidateNested } from 'class-validator';
import { MAX_IMAGES } from '../product-image.service';
import { ConfirmImageDto } from './confirm-image.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'PHONE-IPHONE-001' })
  @IsString()
  @Matches(/^[A-Z0-9-]{3,32}$/, { message: 'sku must be uppercase alphanumeric with hyphens, 3-32 chars' })
  sku!: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max 256GB' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'iphone-15-pro-max-256gb' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  slug?: string;

  @ApiPropertyOptional({ example: 'Detailed product description (Markdown)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 29990000, description: 'Selling price (VND, in dong)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  @ApiPropertyOptional({ example: 34990000, description: 'Listed price (must be >= price)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  comparePrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: { weight: 220, unit: 'g' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: [ConfirmImageDto],
    description: 'Images already uploaded via a presigned URL (see POST /media/presigned). Order determines display position — the first entry becomes the primary image.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_IMAGES)
  @ValidateNested({ each: true })
  @Type(() => ConfirmImageDto)
  images?: ConfirmImageDto[];
}
