import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John', description: 'Omit any field you do not want to change' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Vietnamese phone number — `0` or `+84` prefix + 9 digits' })
  @IsOptional()
  @Matches(/^(\+84|0)\d{9}$/, { message: 'Invalid Vietnamese phone number' })
  phone?: string;
}
