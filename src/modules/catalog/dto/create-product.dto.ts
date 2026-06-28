import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'PHONE-IPHONE-001' })
  @IsString()
  @Matches(/^[A-Z0-9\-]{3,32}$/, { message: 'sku must be uppercase alphanumeric with hyphens, 3-32 chars' })
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

  @ApiPropertyOptional({ example: 'Mô tả chi tiết sản phẩm (Markdown)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 29990000, description: 'Giá bán thực tế (VND, đơn vị đồng)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  @ApiPropertyOptional({ example: 34990000, description: 'Giá niêm yết (phải >= price)' })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  images?: string;
}
