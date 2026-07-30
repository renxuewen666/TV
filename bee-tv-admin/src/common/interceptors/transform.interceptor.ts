import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
    const raw = context.getHandler() && Reflect.getMetadata(RAW_RESPONSE_KEY, context.getHandler());
    if (raw) return next.handle();
    return next.handle().pipe(
      map((data) => ({
        code: 200,
        message: 'success',
        data: data ?? null,
      })),
    );
  }
}
