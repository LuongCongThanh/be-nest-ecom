import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO này mô tả dữ liệu tối thiểu mà API login chấp nhận từ client.
export class LoginDto {
  // Bắt buộc phải là chuỗi đúng định dạng email.
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  // Password phải là chuỗi và không được rỗng.
  @ApiProperty({ example: 'Abc@12345' })
  @IsString()
  @MinLength(1)
  password!: string;
}
