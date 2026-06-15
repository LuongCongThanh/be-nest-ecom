import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../../modules/identity/auth.types';

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
  const user = request.user;
  return data ? user?.[data] : user;
});
