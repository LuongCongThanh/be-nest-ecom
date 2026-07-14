import { CurrentUser } from '@common/decorators/current-user/current-user.decorator';
import { Roles } from '@common/decorators/roles/roles.decorator';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserService } from '../services/user.service';

const USER_EXAMPLE = {
  id: 'uuid',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '0912345678',
  role: 'USER',
  isActive: true,
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile of the authenticated user. `password` is never included. 404 if the account was soft-deleted after the access token was issued (refresh tokens are revoked on delete, but the access token itself stays valid until it expires).',
  })
  @ApiResponse({ status: 200, description: 'Current user profile', schema: { example: USER_EXAMPLE } })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  getMe(@CurrentUser('id') userId: string) {
    return this.userService.getMe(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Partial update — only send the fields you want to change. `email`, `password`, and `role` cannot be changed through this endpoint (use `PATCH /users/me/change-password` for password).',
  })
  @ApiResponse({ status: 200, description: 'Updated profile', schema: { example: USER_EXAMPLE } })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Patch('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change current user password',
    description:
      'Requires `currentPassword` to match. On success, revokes every active refresh token of the user — all other sessions/devices are forced to log in again (this session too, since only the refresh token is revoked, not the current access token).',
  })
  @ApiResponse({ status: 204, description: 'Password changed, all sessions revoked' })
  @ApiResponse({ status: 400, description: 'INVALID_PASSWORD — currentPassword does not match' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all active users (Admin only)',
    description: 'Returns users where `isActive=true` and `deletedAt=null` — deactivated and soft-deleted users are excluded. Ordered by `createdAt` descending. Not paginated.',
  })
  @ApiResponse({ status: 200, description: 'Array of users', schema: { example: [USER_EXAMPLE] } })
  findAll() {
    return this.userService.findAll();
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a user (Admin only)',
    description:
      'Sets `deletedAt` + `isActive=false` on the target user and revokes all of their active refresh tokens (forced logout), atomically. ' +
      "An admin cannot delete their own account. Does NOT cascade to the user's addresses or cart — those rows remain in the database, still pointing at the deleted user.",
  })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({ status: 204, description: 'User soft-deleted' })
  @ApiResponse({ status: 403, description: 'SELF_DELETE_FORBIDDEN — cannot delete your own account' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  remove(@Param('id') targetId: string, @CurrentUser('id') adminId: string) {
    return this.userService.softDelete(targetId, adminId);
  }
}
