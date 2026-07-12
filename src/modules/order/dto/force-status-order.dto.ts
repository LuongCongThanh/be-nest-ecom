import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ForceStatusOrderDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiProperty({ description: 'Mandatory justification for bypassing the normal state machine' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
