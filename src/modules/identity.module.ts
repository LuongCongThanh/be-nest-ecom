import { PrismaModule } from '@common/prisma/prisma.module';
import { AuthController } from '@modules/identity/controllers/auth.controller';
import { UsersController } from '@modules/identity/controllers/users.controller';
import { AuthService } from '@modules/identity/services/auth.service';
import { TokenService } from '@modules/identity/services/token.service';
import { UserService } from '@modules/identity/services/user.service';
import { JwtStrategy } from '@modules/identity/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController, UsersController],
  providers: [AuthService, TokenService, JwtStrategy, UserService],
  exports: [TokenService],
})
export class IdentityModule {}
