// functions/src/routes/admissionIntake.ts
// ------------------------------------------------------------------
// Public intake endpoint for Google Form submissions.
//
// This is the one unauthenticated write path in the system, so it is narrow on
// purpose: it can only ever create an enquiry-stage admission application for
// the single college the token belongs to. It cannot update a stage, read any
// record, or touch any other collection.
//
// Auth is a per-college token, stored only as a SHA-256 hash. The plaintext is
// shown once when generated and embedded in that college's Apps Script; a
// database read cannot recover a live token, and rotating invalidates the old
// one immediately.
// ------------------------------------------------------------------
import * as express from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import {
  buildIntakeApplication,
  coerceApplicantNumbers,
  hashToken,
  intakeDocumentId,
  loadWeights,
  mapFormAnswers,
  nextApplicationNo,
  DEFAULT_INTAKE_DEFAULTS,
  type FieldMapping,
  type IntakeDefaults,
} from '../admissions';
import { intakeLimiter } from '../middleware/rateLimit';

const router = express.Router();

/** Only these keys are read from the request body; anything else is ignored. */
interface IntakeBody {
  token?: unknown;
  responseId?: unknown;
  submittedAt?: unknown;
  answers?: unknown;
}

function iso(value: unknown): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

// POST /api/admissions/ingest
router.post('/ingest', intakeLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const body = (req.body || {}) as IntakeBody;
    const token = String(body.token ?? '').trim();
    if (!token) {
      res.status(401).json({ error: 'Missing ingest token' });
      return;
    }

    const tokenHash = hashToken(token);
    const tokenDoc = await db.collection('admissionIngestTokens').doc(tokenHash).get();
    if (!tokenDoc.exists || tokenDoc.data()?.revoked === true) {
      res.status(401).json({ error: 'Invalid or revoked ingest token' });
      return;
    }
    const collegeId = String(tokenDoc.data()?.collegeId || '');
    if (!collegeId) {
      res.status(401).json({ error: 'Ingest token is not linked to a college' });
      return;
    }

    const configDoc = await db
      .collection('colleges')
      .doc(collegeId)
      .collection('config')
      .doc('admission')
      .get();
    const config = configDoc.data() || {};
    if (config.intakeEnabled !== true) {
      res.status(403).json({ error: 'Form intake is disabled for this college' });
      return;
    }

    const configRef = configDoc.ref;
    const countRejection = async () => {
      await configRef
        .update({
          rejectedCount: admin.firestore.FieldValue.increment(1),
          lastSubmissionAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        .catch(() => undefined);
    };

    const answers =
      body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
        ? (body.answers as Record<string, unknown>)
        : {};
    if (Object.keys(answers).length === 0) {
      await countRejection();
      res.status(422).json({ error: 'Submission contained no answers' });
      return;
    }

    const mapping = (config.fieldMapping && typeof config.fieldMapping === 'object'
      ? config.fieldMapping
      : {}) as FieldMapping;
    const defaults = {
      ...DEFAULT_INTAKE_DEFAULTS,
      ...((config.intakeDefaults && typeof config.intakeDefaults === 'object'
        ? config.intakeDefaults
        : {}) as IntakeDefaults),
    };

    const { applicant: mapped, unmappedQuestions } = mapFormAnswers(answers, mapping, defaults);
    const applicant = coerceApplicantNumbers(mapped);

    // A name is the minimum for an enquiry to be actionable. Everything else
    // can be filled in by the admissions office afterwards.
    const name = String(applicant.applicantName || '').trim();
    if (!name) {
      await countRejection();
      res.status(422).json({
        error: 'No applicant name. Map a form question to applicantName in Admission Center settings.',
        unmappedQuestions,
      });
      return;
    }

    const responseId = String(body.responseId ?? '').trim() || `no-id-${Date.now()}`;
    const docId = intakeDocumentId(collegeId, responseId);
    const ref = db.collection('admissionApplications').doc(docId);

    // Apps Script retries on flaky networks, so the same submission can arrive
    // twice. A deterministic id makes the second arrival a no-op instead of a
    // duplicate enquiry.
    const existing = await ref.get();
    if (existing.exists) {
      res.status(200).json({ status: 'duplicate', applicationNo: existing.data()?.applicationNo || '' });
      return;
    }

    const cycleYear = new Date().getFullYear();
    const [weights, applicationNo] = await Promise.all([
      loadWeights(collegeId),
      nextApplicationNo(db, collegeId, cycleYear),
    ]);

    const document = buildIntakeApplication(applicant, {
      collegeId,
      applicationNo,
      cycleYear,
      weights,
      source: defaults.source || 'Google Form',
    });

    await ref.create(document);

    await configRef
      .update({
        submissionCount: admin.firestore.FieldValue.increment(1),
        lastSubmissionAt: iso(body.submittedAt) || admin.firestore.FieldValue.serverTimestamp(),
      })
      .catch(() => undefined);

    res.status(201).json({
      status: 'created',
      applicationNo,
      unmappedQuestions,
    });
  } catch (err) {
    // Firestore throws already-exists when two deliveries race past the check
    // above; that is a duplicate, not a failure.
    if ((err as { code?: number })?.code === 6) {
      res.status(200).json({ status: 'duplicate' });
      return;
    }
    console.error('[admissionIntake] error:', err);
    res.status(500).json({ error: 'Failed to record the submission' });
  }
});

export { router };
