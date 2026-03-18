import { Request, Response } from 'express';

export interface LogContext {
  userId?: string;
  workspaceId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorStr = error ? ` | Error: ${error.message}` : '';
    console.error(this.formatMessage('error', message + errorStr, context));
    if (error?.stack && process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // HTTP request logging
  logRequest(req: Request, res: Response, responseTime?: number): void {
    const context: LogContext = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const message = `${req.method} ${req.originalUrl} - ${res.statusCode}${
      responseTime ? ` - ${responseTime}ms` : ''
    }`;

    if (res.statusCode >= 400) {
      this.error(message, undefined, context);
    } else {
      this.info(message, context);
    }
  }
}

export const logger = new Logger();