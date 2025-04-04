import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
          // This is a paginated response
          return {
            data: data.items,
            meta: data.meta,
          };
        }

        return {
          data,
          meta: {
            statusCode: response.statusCode,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}