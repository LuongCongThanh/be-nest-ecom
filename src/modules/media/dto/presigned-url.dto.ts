import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsIn, IsString, ValidateNested } from 'class-validator';

export class PresignedFileDto {
  @ApiProperty({ example: 'image/jpeg', enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;
}

export class PresignedUrlDto {
  @ApiProperty({ example: 'products', enum: ['products', 'categories', 'users'] })
  @IsString()
  @IsIn(['products', 'categories', 'users'])
  folder!: string;

  @ApiProperty({ type: [PresignedFileDto], description: 'One entry per file you intend to upload' })
  @ValidateNested({ each: true })
  @Type(() => PresignedFileDto)
  @ArrayMinSize(1)
  files!: PresignedFileDto[];
}
