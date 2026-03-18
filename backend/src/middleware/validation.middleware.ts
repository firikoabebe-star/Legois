import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/utils/logger';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error', {
          errors,
          body: req.body,
          ipAddress: req.ip,
        });
        
        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
        return;
      }
      
      logger.error('Unexpected validation error', error as Error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          error: 'Query validation failed',
          details: errors,
        });
        return;
      }
      
      logger.error('Unexpected query validation error', error as Error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          error: 'Parameter validation failed',
          details: errors,
        });
        return;
      }
      
      logger.error('Unexpected parameter validation error', error as Error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
};