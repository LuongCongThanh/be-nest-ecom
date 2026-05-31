import { Module } from '@nestjs/common';
import { AuthController } from './identity/controllers/auth.controller';
import { AuthService } from './identity/services/auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService]
})
export class IdentityModule {}
