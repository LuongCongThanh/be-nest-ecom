import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryCategoryDto {
  @ApiPropertyOptional({
    enum: ['flat', 'tree'],
    default: 'flat',
    description: '`flat`: paginated list (default). `tree`: nested children[], no pagination, ignores `parentId`/`search`/`page`/`limit`.',
  })
  @IsOptional()
  @IsIn(['flat', 'tree'])
  format?: 'flat' | 'tree' = 'flat';

  @ApiPropertyOptional({ description: 'Filter by parent. Omit to get all levels' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ description: 'Include categories with isActive=false. Soft-deleted categories are never included.', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeInactive?: boolean;
}
