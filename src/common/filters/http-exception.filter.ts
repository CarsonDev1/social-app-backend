// src/common/filters/http-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { formatVietnamDateTime } from 'src/common/utils/date-utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();
    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: formatVietnamDateTime(new Date()),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      exception.stack,
      HttpExceptionFilter.name,
    );

    response.status(status).send(errorResponse);
  }
}