import { Public } from '@common/decorators/public/public.decorator';
import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto/refresh.dto';
import { RegisterDto } from '../dto/register.dto/register.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login and receive access + refresh token' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // @Public() because the caller has no valid access token — that's why they're refreshing
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'INVALID_REFRESH_TOKEN | REFRESH_TOKEN_REPLAY_DETECTED | REFRESH_TOKEN_REVOKED | REFRESH_TOKEN_EXPIRED' })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @ApiOperation({ summary: 'Logout and invalidate current session refresh token' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser('id') userId: string, @Body() dto: RefreshDto) {
    await this.authService.logout(userId, dto);
  }

  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'All sessions revoked' })
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser('id') userId: string) {
    await this.authService.logoutAll(userId);
  }
}
