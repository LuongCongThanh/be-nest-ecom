import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class PresignedUrlDto {
  @ApiProperty({ example: 'image/jpeg', enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;

  @ApiProperty({ example: 'products', enum: ['products', 'categories', 'users'] })
  @IsString()
  @IsIn(['products', 'categories', 'users'])
  folder!: string;
}
