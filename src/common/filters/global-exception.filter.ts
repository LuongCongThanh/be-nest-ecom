import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ErrorResponse, FieldError } from '../interfaces/error-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let errors: any[] = [];
    let meta: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        code = exceptionResponse.code ?? this.statusToCode(statusCode);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message = exceptionResponse.message ?? exception.message;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        meta = exceptionResponse.meta;
        if (Array.isArray(exceptionResponse.message)) {
          // class-validator hoặc exceptionFactory có thể trả array message/object
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          errors = exceptionResponse.message.map((item: string | FieldError) => {
            if (typeof item === 'string') {
              return {
                field: item.split(' ')[0],
                message: item,
              };
            }

            return item;
          });
          message = 'Validation failed';
          code = 'VALIDATION_FAILED';
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message = exceptionResponse;
        code = this.statusToCode(statusCode);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this value already exists';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        code = 'RECORD_NOT_FOUND';
        message = 'Record not found';
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      code,
      message,
      errors: errors.length > 0 ? errors : undefined,
      meta,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_FAILED',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
