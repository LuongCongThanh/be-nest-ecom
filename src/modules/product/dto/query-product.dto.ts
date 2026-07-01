import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export enum ProductSortOption {
  FEATURED = 'featured',
  PRICE_ASC = 'priceAsc',
  PRICE_DESC = 'priceDesc',
  NEWEST = 'newest',
  BESTSELLER = 'bestseller',
}

const boolTransform = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class QueryProductDto {
  @ApiPropertyOptional({ description: 'Text search on name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category slug (includes all descendants)' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID (direct match only, no descendants)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'true = only in-stock products (default behaviour); false = include out-of-stock' })
  @IsOptional()
  @IsBoolean()
  @Transform(boolTransform)
  inStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(boolTransform)
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Minimum price (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ProductSortOption, default: ProductSortOption.FEATURED })
  @IsOptional()
  @IsEnum(ProductSortOption)
  sort?: ProductSortOption = ProductSortOption.FEATURED;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
