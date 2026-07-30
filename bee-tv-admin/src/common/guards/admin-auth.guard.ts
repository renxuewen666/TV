import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_APP_USER_KEY } from '../decorators/allow-app-user.decorator';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const allowsAppUser = this.reflector.getAllAndOverride<boolean>(ALLOW_APP_USER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowsAppUser) return true;

    const request = context.switchToHttp().getRequest();
    if (request.user?.role !== 'admin') throw new ForbiddenException('需要管理员权限');
    return true;
  }
}
