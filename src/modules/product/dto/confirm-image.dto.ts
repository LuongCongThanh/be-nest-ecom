import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmImageDto {
  @ApiProperty({ example: 'products/uuid.jpg', description: 'Storage key returned by /media/presigned' })
  @IsString()
  @Matches(/^(products|categories|users)\/[a-f0-9-]+\.(jpg|jpeg|png|webp)$/, {
    message: 'key must be a valid storage path from /media/presigned',
  })
  key!: string;
}
