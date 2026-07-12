import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ShipOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrier?: string;
}
