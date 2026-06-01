import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO này mô tả dữ liệu tối thiểu mà API login chấp nhận từ client.
export class LoginDto {
  // Bắt buộc phải là chuỗi đúng định dạng email.
  @IsEmail()
  email!: string;

  // Password phải là chuỗi và không được rỗng.
  @IsString()
  @MinLength(1)
  password!: string;
}
