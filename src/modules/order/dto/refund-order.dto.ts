import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RefundOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Partial refund amount (VND) — not supported in MVP, full refund only' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partial?: number;
}
