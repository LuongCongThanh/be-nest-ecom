import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

// Describes the minimum payload the login API accepts from the client.
export class LoginDto {
  // Must be a properly formatted email string.
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  // Password must be a non-empty string.
  @ApiProperty({ example: 'Abc@12345' })
  @IsString()
  @MinLength(1)
  password!: string;
}
