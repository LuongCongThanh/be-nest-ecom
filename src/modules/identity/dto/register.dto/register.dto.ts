import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// DTO này định nghĩa payload đăng ký tài khoản và các rule validate đầu vào.
export class RegisterDto {
  // Email phải đúng định dạng trước khi đi vào service.
  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  // Password phải đủ dài và có chữ hoa, chữ thường, số để tăng độ mạnh.
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain uppercase, lowercase, and number',
  })
  password!: string;

  // firstName/lastName là dữ liệu hồ sơ cơ bản, giới hạn độ dài để tránh input xấu.
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;
}
