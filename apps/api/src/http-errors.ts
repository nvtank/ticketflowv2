import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    // Prisma/runtime errors may contain credentials or query input. Never serialize or log them.
    const message = error instanceof HttpException ? error.message : 'Internal server error';
    if (status === 500) console.error('Unhandled API error');
    response.status(status).json({ statusCode: status, message });
  }
}
