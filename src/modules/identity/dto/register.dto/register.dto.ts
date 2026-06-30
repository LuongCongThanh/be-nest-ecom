import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Defines the account registration payload and input validation rules.
export class RegisterDto {
  // Email must be properly formatted before reaching the service.
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  // Password must be long enough and contain uppercase, lowercase, and digits for strength.
  @ApiProperty({ example: 'Abc@12345' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain uppercase, lowercase, and number',
  })
  password!: string;

  // firstName/lastName are basic profile fields; length is capped to prevent malicious input.
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;
}
