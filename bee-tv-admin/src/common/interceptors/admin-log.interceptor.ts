import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdminLogService } from '../../modules/admin-log/admin-log.service';

const MODULE_LABELS: Array<[RegExp, string]> = [
  [/^\/api\/auth\//, '认证'],
  [/^\/api\/users?/, '权限管理'],
  [/^\/api\/admin-logs/, '管理员日志'],
  [/^\/api\/database/, '数据库管理'],
  [/^\/api\/member/, '会员管理'],
  [/^\/api\/payment|^\/api\/epay/, '支付管理'],
  [/^\/api\/system/, '系统设置'],
  [/^\/api\/advertisement|^\/api\/notice|^\/api\/marquee|^\/api\/hotsearch/, '广告管理'],
  [/^\/api\/danmaku/, '弹幕管理'],
  [/^\/api\/app-manage|^\/api\/home-layout|^\/api\/repo|^\/api\/api-manage/, '客户端管理'],
  [/^\/api\/compile/, '版本管理'],
];

@Injectable()
export class AdminLogInterceptor implements NestInterceptor {
  constructor(private adminLogService: AdminLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<any>();
    const method = String(req.method || '').toUpperCase();
    const path = req.originalUrl || req.url || '';
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        if (!this.shouldLog(method, path)) return;
        const user = req.user || {};
        const moduleName = this.resolveModule(path);
        const remark = `${method} ${path} 成功，用时 ${Date.now() - startedAt}ms`;
        this.adminLogService.create({
          adminId: Number(user.sub || 0),
          admin: user.username || user.email || '',
          action: this.resolveAction(method),
          module: moduleName,
          method,
          path,
          ip: this.getIp(req),
          remark,
        });
      }),
    );
  }

  private shouldLog(method: string, path: string) {
    if (!path.startsWith('/api/')) return false;
    if (path.startsWith('/api/docs')) return false;
    if (path.startsWith('/api/app-config')) return false;
    if (method === 'GET' && !path.startsWith('/api/auth/login')) return false;
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }

  private resolveAction(method: string) {
    const map: Record<string, string> = { POST: '新增/提交', PUT: '编辑/更新', PATCH: '编辑/更新', DELETE: '删除/清空' };
    return map[method] || method;
  }

  private resolveModule(path: string) {
    const item = MODULE_LABELS.find(([reg]) => reg.test(path));
    return item?.[1] || '系统';
  }

  private getIp(req: any) {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || '';
  }
}
