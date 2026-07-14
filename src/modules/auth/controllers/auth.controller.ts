import { Public } from '@common/decorators/public/public.decorator';
import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto/refresh.dto';
import { RegisterDto } from '../dto/register.dto/register.dto';
import { AuthService } from '../services/auth.service';

const AUTH_EXAMPLE = {
  user: {
    id: 'uuid',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    isActive: true,
    emailVerified: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refreshToken: 'a1b2c3d4-e5f6-...',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a `USER`-role account (`emailVerified=false`) and immediately returns a token pair — no separate login step needed. Email is case-normalized (lowercased) before uniqueness is checked.',
  })
  @ApiResponse({ status: 201, description: 'User created, token pair issued', schema: { example: AUTH_EXAMPLE } })
  @ApiResponse({ status: 409, description: 'EMAIL_ALREADY_EXISTS' })
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({
    summary: 'Login and receive access + refresh token',
    description:
      'Rejects soft-deleted or `isActive=false` accounts. Runs `bcrypt.compare` even when the email does not exist (against a dummy hash) so response timing cannot be used to enumerate registered emails.',
  })
  @ApiResponse({ status: 200, description: 'Token pair issued', schema: { example: AUTH_EXAMPLE } })
  @ApiResponse({ status: 401, description: 'INVALID_CREDENTIALS | ACCOUNT_INACTIVE' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // @Public() because the caller has no valid access token — that's why they're refreshing
  @ApiOperation({
    summary: 'Refresh access token using a valid refresh token',
    description:
      'Rotates the refresh token (old one is marked used, a new one is issued in the same family). Reusing an already-rotated token is treated as compromise and revokes the entire token family, forcing re-login on every device — except within a 5-second tolerance window, where the same replayed token is treated as a client retry, not reuse.',
  })
  @ApiResponse({ status: 200, description: 'New token pair issued', schema: { example: { accessToken: AUTH_EXAMPLE.accessToken, refreshToken: AUTH_EXAMPLE.refreshToken } } })
  @ApiResponse({ status: 401, description: 'INVALID_REFRESH_TOKEN | REFRESH_TOKEN_REPLAY_DETECTED | REFRESH_TOKEN_REVOKED | REFRESH_TOKEN_EXPIRED' })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @ApiOperation({
    summary: 'Logout and invalidate current session refresh token',
    description:
      'Revokes only the refresh token family tied to the given `refreshToken` — other devices/sessions of the same user stay logged in. The current access token remains valid until it naturally expires.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser('id') userId: string, @Body() dto: RefreshDto) {
    await this.authService.logout(userId, dto);
  }

  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Revokes every refresh token family belonging to the user, forcing re-login on all devices. Current access tokens remain valid until they naturally expire.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'All sessions revoked' })
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser('id') userId: string) {
    await this.authService.logoutAll(userId);
  }
}
