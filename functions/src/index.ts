// functions/src/index.ts
// Main entry point — V2 HTTPS + Callable functions

import { onRequest } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import express from 'express'
import cors from 'cors'

// ─── Load .env BEFORE anything else ───
import * as dotenv from 'dotenv'
dotenv.config()

// ─── Initialize Firebase Admin ───
import * as admin from 'firebase-admin'
admin.initializeApp()

// ─── Import routes ───
import { router as aiQuestionsRouter } from './routes/ai-questions'
import { router as questionsRouter } from './routes/questions'
import { router as papersRouter } from './routes/papers'
import { router as configRouter } from './routes/config'
import { generalLimiter } from './middleware/rateLimit'

// ═══════ Student Auth callable functions ═══════
import {
  syncStudentsToAuth,
  createStudentAuth,
  bulkCreateStudentAccounts,
} from './studentAuth'
import { provisionUser } from './userProvisioning'
import { grantUserRole, diagnoseIdentity } from './roleManagement'
import { bulkProvisionStaff } from './staffAuth'
import { resetUserPassword } from './accountManagement'
import { resetCollegeData } from './collegeCleanup'
import {
  beginMyAssignmentSubmission,
  cancelMyAssignmentSubmission,
  cleanupExpiredAssignmentSubmissionDrafts,
  finalizeMyAssignmentSubmission,
  getMyAssignments,
  gradeAssignmentSubmission,
  updateMyStudentProfile,
  createFacultyAssignment,
  updateFacultyAssignment,
  transitionFacultyAssignment,
  deleteFacultyAssignmentDraft,
  getAssignmentSubmissionDownload,
} from './studentPortal'
import {
  getMyStudentTests,
  getMyTestInstructions,
  startMyStudentTest,
  getMyActiveStudentTest,
  autosaveMyStudentTest,
  submitMyStudentTest,
  logMyStudentTestEvent,
  getMyStudentTestResult,
  listManagedAssessmentTests,
  scheduleAssessmentTest,
  publishAssessmentTest,
  cancelAssessmentTest,
  gradeStudentAssessmentSubmission,
  listPendingAssessmentSubmissions,
  autoSubmitExpiredStudentTests,
} from './studentAssessments'
import {
  listManagedGradeRecords,
  saveDraftGradeRecords,
  publishGradeRecords,
  deleteDraftGradeRecords,
} from './gradeRecords'
import { savePaper, reviewPaper, getPaperFileDownload } from './paperWorkflow'

const app = express()

// API is protected by Firebase auth tokens, so reflect the caller's origin
// rather than hard-coding a host list. This keeps the Firebase Hosting app,
// local development and preview environments all working.
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-College-Id'],
}))

app.options('*', cors())
app.use(express.json({ limit: '10mb' }))
app.use(generalLimiter)

const healthHandler = (req: any, res: any) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    environment: 'firebase-functions',
  })
}
app.get('/api/health', healthHandler)
app.get('/health', healthHandler)
app.get('/', healthHandler)

// ─── Mount routes ───
// Support both /api/* and /* paths because Firebase Functions v2 strips the function name
// from the URL. Calling https://.../api/ai/generate-questions arrives as /ai/generate-questions
app.use('/api/ai-questions', aiQuestionsRouter)
app.use('/ai-questions', aiQuestionsRouter)
app.use('/api/ai', aiQuestionsRouter)
app.use('/ai', aiQuestionsRouter)
app.use('/api/questions', questionsRouter)
app.use('/questions', questionsRouter)
app.use('/api/papers', papersRouter)
app.use('/papers', papersRouter)
app.use('/api/config', configRouter)
app.use('/config', configRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
})

// ─── Express API export (v2) ───
// FIX: Removed secrets array to avoid overlap error "Secret env var overlaps non-secret env var"
// GEMINI_API_KEY etc should be set via regular env vars (.env file) or Firebase env config
// If you want to use Secret Manager, set them ONLY as secrets and remove from .env
export const api = onRequest(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 10,
  },
  app
)

// ═══════ Callable functions exports ═══════
export {
  syncStudentsToAuth,
  createStudentAuth,
  bulkCreateStudentAccounts,
  provisionUser,
  bulkProvisionStaff,
  resetUserPassword,
  grantUserRole,
  diagnoseIdentity,
  resetCollegeData,
  updateMyStudentProfile,
  getMyAssignments,
  beginMyAssignmentSubmission,
  finalizeMyAssignmentSubmission,
  cancelMyAssignmentSubmission,
  gradeAssignmentSubmission,
  cleanupExpiredAssignmentSubmissionDrafts,
  createFacultyAssignment,
  updateFacultyAssignment,
  transitionFacultyAssignment,
  deleteFacultyAssignmentDraft,
  getAssignmentSubmissionDownload,
  getMyStudentTests,
  getMyTestInstructions,
  startMyStudentTest,
  getMyActiveStudentTest,
  autosaveMyStudentTest,
  submitMyStudentTest,
  logMyStudentTestEvent,
  getMyStudentTestResult,
  listManagedAssessmentTests,
  scheduleAssessmentTest,
  publishAssessmentTest,
  cancelAssessmentTest,
  gradeStudentAssessmentSubmission,
  listPendingAssessmentSubmissions,
  autoSubmitExpiredStudentTests,
  listManagedGradeRecords,
  saveDraftGradeRecords,
  publishGradeRecords,
  deleteDraftGradeRecords,
  savePaper,
  reviewPaper,
  getPaperFileDownload,
}
