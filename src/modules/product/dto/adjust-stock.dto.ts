import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, NotEquals } from 'class-validator';

const MANUAL_TYPES = [StockMovementType.INBOUND, StockMovementType.ADJUSTMENT] as const;
type ManualStockType = (typeof MANUAL_TYPES)[number];

export class AdjustStockDto {
  @ApiProperty({ enum: MANUAL_TYPES })
  @IsEnum(MANUAL_TYPES)
  type!: ManualStockType;

  @ApiProperty({ description: 'Positive integer for INBOUND, negative for ADJUSTMENT decrease', example: 10 })
  @IsInt()
  @NotEquals(0, { message: 'delta must not be zero' })
  delta!: number;

  @ApiPropertyOptional({ description: 'Required for all manual movements', example: 'Supplier delivery PO-2026-001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;
}
