import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 'uuid-product-id' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ example: null, description: 'Reserved for future variant support' })
  @IsOptional()
  @IsString()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
