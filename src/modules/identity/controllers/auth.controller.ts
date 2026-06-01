import { Public } from '@common/decorators/public/public.decorator';
import { AuthService } from '@modules/identity/services/auth.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto/login.dto';
import { RegisterDto } from '../dto/register.dto/register.dto';

// Controller này nhận HTTP request cho feature auth và chuyển tiếp business logic sang AuthService.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Route public để user mới đăng ký tài khoản.
  // @Body() sẽ map JSON body vào RegisterDto rồi ValidationPipe global sẽ validate trước khi vào service.
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Route public để user đăng nhập và nhận access/refresh token.
  // Login là hành động đọc/xác thực phiên nên trả 200 OK thay vì 201 Created.
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
