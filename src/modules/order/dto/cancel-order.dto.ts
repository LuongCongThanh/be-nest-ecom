import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({ description: 'Required for admin force cancel; ignored for user self-cancel' })
  @IsOptional()
  @IsString()
  reason?: string;
}
