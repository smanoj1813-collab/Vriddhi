import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ error: 'Validation failed', details: errors });
        return;
      }
      res.status(400).json({ error: 'Invalid request body' });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ error: 'Query validation failed', details: errors });
        return;
      }
      res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
};