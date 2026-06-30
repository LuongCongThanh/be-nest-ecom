import { PrismaModule } from '@common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [TokenService],
})
export class AuthModule {}
