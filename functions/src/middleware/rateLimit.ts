import { RequestHandler } from 'express';

// Use require with type assertion to bypass TS import issues
const rateLimit = require('express-rate-limit') as (options: any) => RequestHandler;

export const aiGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  message: {
    error: 'Too many AI generation requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Use user ID if available, fallback to IP
    const userId = req.user?.uid;
    return userId || req.ip || 'unknown';
  },
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many requests. Please slow down.',
  },
});