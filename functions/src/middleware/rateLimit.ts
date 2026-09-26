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

// Paths that carry their own per-USER budget (below). The general limiter is
// per IP, and a computer lab or hostel shares one public IP: thirty students
// editing resumes at once (autosave + live preview on every pause) would trip
// a 100/min IP budget within a minute for the whole room.
const PER_USER_BUDGET_PATHS = /^\/(?:api\/)?resume\/(?:me|preview)\/?$/;

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many requests. Please slow down.',
  },
  skip: (req: any) => PER_USER_BUDGET_PATHS.test(req.path || ''),
});

/**
 * Resume Builder editor traffic (autosave + preview): per signed-in user, so a
 * shared IP never starves anyone. Mounted after verifyAuth so req.user exists.
 */
export const resumeEditorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  message: { error: 'You are editing faster than we can save. Pause a moment and continue.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.uid || req.ip || 'unknown',
});

/**
 * Resume PDF renders launch Chrome (≈1 vCPU-second each). Credits already cap
 * the yearly volume; this only stops a stuck client from hammering the
 * renderer in a tight loop.
 */
export const resumePdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  message: { error: 'Too many PDF requests in a minute. Wait a moment and try again — no credit was used.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.uid || req.ip || 'unknown',
});
/**
 * Report PDF renders (`/attendance/register/pdf`) also launch Chrome. An admin
 * exporting a register a few times is normal; a loop is not. The client falls
 * back to its own renderer when this answers 429, so a tripped limiter costs a
 * slower download, never a failed one.
 */
export const reportPdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many report downloads in a minute. The next one will render in your browser instead.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.uid || req.ip || 'unknown',
});

/**
 * Question-paper import worker. The browser drives the loop — one call per
 * document (or per unpack batch) — so a 40-document archive is 40+ calls in a
 * few minutes. The generic aiGenerationLimiter (20 per 15 min) would trip on the
 * second document, and importing is already superadmin-only, so this budget is
 * per user and generous but still bounded: a runaway loop cannot spin forever.
 * 300 calls ≈ 240 documents per 15 minutes, and every call is a superadmin action.
 */
export const importWorkerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: 'The import worker is running too fast. Wait a few minutes, then press Continue — the job resumes where it stopped.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.uid || req.ip || 'unknown',
});

/**
 * Public Google Form intake. Unauthenticated by design, so it gets a far
 * tighter budget than the general limiter: a real college form receives a
 * handful of submissions a minute at peak, and a leaked token should not turn
 * into a firehose of enquiry documents.
 */
export const intakeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many form submissions. Please retry shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});
