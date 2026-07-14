import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Password currently in use, for verification' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: 'Min 8, max 64 chars. Must contain at least one uppercase, one lowercase, and one digit.' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'newPassword must contain uppercase, lowercase, and number',
  })
  newPassword!: string;
}
