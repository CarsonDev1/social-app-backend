// src/common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { formatVietnamDateTime } from 'src/common/utils/date-utils';

export interface Response<T> {
  data: T;
  meta?: {
    [key: string]: any;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        const response = context.switchToHttp().getResponse();

        if (data && data.items && data.meta) {
          // Đây là phản hồi phân trang
          return {
            data: data.items,
            meta: {
              ...data.meta,
              timestamp: formatVietnamDateTime(new Date())
            },
          };
        }

        return {
          data,
          meta: {
            statusCode: response.statusCode,
            timestamp: formatVietnamDateTime(new Date())
          },
        };
      }),
    );
  }
}