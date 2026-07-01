import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@common/decorators/public/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '@common/decorators/optional-auth/optional-auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [context.getHandler(), context.getClass()]);
    if (isOptional) {
      return super.canActivate(context) as Promise<boolean> | boolean;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [context.getHandler(), context.getClass()]);
    if (isOptional) {
      if (err) throw err;
      return user ?? null;
    }
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: 'Token has expired' });
    }
    if (err || !user) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Invalid token' });
    }
    return user;
  }
}
