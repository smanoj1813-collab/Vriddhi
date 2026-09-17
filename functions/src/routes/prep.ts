// functions/src/routes/prep.ts
//
// PrepInsta-style Prep-Content API for UG/PG Commerce & Management.
// Shared backbone on Firebase project vriddhi-academic:
//   - prep_subjects/{subjectId}
//   - prep_subjects/{subjectId}/topics/{topicId}
//   - universalQuestions (practice pool linkage via prepTags.topicIds)
//   - prep_progress/{uid}
//
// Endpoints:
//   GET  /subjects                      → List subjects (publicly for published, superadmin all)
//   GET  /subjects/:subjectId           → Subject details
//   GET  /subjects/:subjectId/topics    → List topics for subject
//   GET  /subjects/:subjectId/topics/:topicId → Single topic full payload
//   POST /content/draft                 → (Superadmin) Generate AI draft via capped pipeline
//   POST /content/publish               → (Superadmin) Validate & publish topic
//   POST /content/save                  → (Superadmin) Curator updates / edits
//   POST /subjects                      → (Superadmin) Create or update subject
//   GET  /practice                      → Sample random practice questions from pool
//   GET  /progress                      → (Signed in) Get learner's topic progress
//   POST /progress                      → (Signed in) Save learner's progress / quiz result
//   POST /auth/init                     → (Signed in) Set student role claim for B2C learner
//   POST /seed-bba                      → (Superadmin) Seed BBA subjects & topics across 3 years
//   POST /seed-all                      → (Superadmin) Seed every program (or a chosen subset / degree level)

import { Router, Response } from 'express'
import { db, auth } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth'
import { aiGenerationLimiter } from '../middleware/rateLimit'
import { geminiClient, openaiClient, deepseekClient } from '../config/aiProviders'
import {
  parsePrepDraft,
  validatePublishTransition,
  samplePracticeQuestions,
  buildPrepAiPrompt,
  validatePrepCatalog,
  resolveSeedPrograms,
  chunkArray,
  getPrepProgramsForLevel,
  effectiveDegreeLevel,
  PrepSubject,
  PrepTopic,
  UniversalQuestion,
} from '../prepShared'
import {
  BBA_SUBJECTS,
  SEEDED_BBA_TOPICS,
  SEEDED_UNIVERSAL_QUESTIONS,
} from '../data/bbaSeedData'
import {
  MCOM_SUBJECTS,
  SEEDED_MCOM_TOPICS,
  SEEDED_MCOM_QUESTIONS,
} from '../data/mcomSeedData'
import {
  BSC_SUBJECTS,
  SEEDED_BSC_TOPICS,
  SEEDED_BSC_QUESTIONS,
} from '../data/bscSeedData'
import {
  BA_SUBJECTS,
  SEEDED_BA_TOPICS,
  SEEDED_BA_QUESTIONS,
} from '../data/baSeedData'

/**
 * Registry of every program that ships with seed data. Order is the order the
 * master seeder walks when `programs` is 'all'.
 */
const PREP_SEED_BUNDLES: Array<{
  code: string
  label: string
  subjects: PrepSubject[]
  topics: Record<string, PrepTopic[]>
  questions: UniversalQuestion[]
}> = [
  { code: 'bba', label: 'BBA', subjects: BBA_SUBJECTS, topics: SEEDED_BBA_TOPICS, questions: SEEDED_UNIVERSAL_QUESTIONS },
  { code: 'bsc', label: 'B.Sc', subjects: BSC_SUBJECTS, topics: SEEDED_BSC_TOPICS, questions: SEEDED_BSC_QUESTIONS },
  { code: 'ba', label: 'BA', subjects: BA_SUBJECTS, topics: SEEDED_BA_TOPICS, questions: SEEDED_BA_QUESTIONS },
  { code: 'mcom', label: 'M.Com', subjects: MCOM_SUBJECTS, topics: SEEDED_MCOM_TOPICS, questions: SEEDED_MCOM_QUESTIONS },
]

/** Firestore allows at most 500 writes per commit; stay well under it. */
const FIRESTORE_BATCH_LIMIT = 400

export const router = Router()

function todayDateId(): string {
  return new Date().toISOString().slice(0, 10)
}

function requireSuperadmin(req: AuthenticatedRequest, res: Response): boolean {
  if (req.user?.role !== 'superadmin') {
    res.status(403).json({ error: 'This operation is restricted to the platform superadmin / content team.' })
    return false
  }
  return true
}

/**
 * Provider cascade for generating structured prep guides (Gemini -> DeepSeek/OpenAI -> offline composer).
 * Returns real token counts for telemetry metering.
 */
async function generateDraftWithProviders(opts: {
  subjectName: string
  topicTitle: string
  stream?: string
  difficulty?: string
  program?: string
}): Promise<{ content: any; provider: string; tokensIn: number; tokensOut: number }> {
  const prompt = buildPrepAiPrompt(opts)
  let rawText = ''
  let provider = 'gemini'
  let tokensIn = 0
  let tokensOut = 0

  const gemini = geminiClient()
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent(prompt)
      rawText = result.response.text()
      const usage = (result.response as any).usageMetadata
      tokensIn = Number(usage?.promptTokenCount) || 0
      tokensOut = Number(usage?.candidatesTokenCount) || 0
    } catch (err) {
      console.warn('[Prep] Gemini provider failed:', err)
    }
  }

  if (!rawText) {
    const client = deepseekClient() || openaiClient()
    if (client) {
      try {
        const isDeepseek = !!deepseekClient()
        const completion = await client.chat.completions.create({
          model: isDeepseek ? 'deepseek-chat' : 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        })
        rawText = completion.choices[0]?.message?.content || ''
        tokensIn = Number(completion.usage?.prompt_tokens) || 0
        tokensOut = Number(completion.usage?.completion_tokens) || 0
        provider = isDeepseek ? 'deepseek' : 'openai'
      } catch (err) {
        console.warn('[Prep] OpenAI/DeepSeek provider failed:', err)
      }
    }
  }

  // Parse candidate output
  let parsed = parsePrepDraft(rawText)

  // Dev offline composer fallback if no keys or providers unconfigured
  if (!parsed.valid || !parsed.data) {
    provider = 'offline-composer'
    tokensIn = 0
    tokensOut = 0
    parsed = parsePrepDraft({
      explanationMd: `# ${opts.topicTitle} (${opts.subjectName})

### Core Concept & Intuition
**${opts.topicTitle}** is a cornerstone topic in the undergraduate study of ${opts.subjectName} (${(opts.stream || 'management').toUpperCase()} stream). It provides the conceptual foundation for managerial decision making and operational excellence in modern enterprises.

In Indian industry (e.g. Tata, Reliance, Infosys, and high-growth startups), managers apply the core principles of ${opts.topicTitle} to optimize resource allocation, enhance process efficiency, and ensure organizational sustainability.

---

### Key Principles & Framework
- **Systematic Structure**: Breaks down complex enterprise challenges into clear, actionable components.
- **Strategic Alignment**: Ensures that departmental decisions directly support broader corporate objectives.
- **Continuous Evaluation**: Incorporates robust feedback mechanisms to measure outcomes against university syllabus standards.

---

### Real-World Business Application
Corporate leaders utilize this knowledge to navigate market uncertainties, manage stakeholder expectations, and comply with standard governance norms.

---

### Model University Examination Structure
When writing answers for 10-mark questions:
1. Define the fundamental concept with formal academic definitions.
2. Draw a neat schematic diagram or conceptual flow chart.
3. Explain the primary components using structured sub-headings.
4. Conclude with a practical Indian business case example.`,
      formulas: [
        {
          id: 'formula-1',
          label: `${opts.topicTitle} Primary Governing Formulation`,
          formula: 'Output / Outcome = f(Inputs, Strategic Framework, Execution Efficiency)',
          exampleQ: `How do practitioners measure efficiency and outcomes in ${opts.topicTitle}?`,
          exampleA: 'By comparing standard benchmark metrics against actual performance indicators over the reporting period.',
        },
      ],
      tricks: [
        {
          id: 'trick-1',
          title: `Exam Tip for ${opts.topicTitle}`,
          trick: `Always link ${opts.topicTitle} to both theoretical principles and modern Indian case studies in 10-mark university answers.`,
          whenToUse: 'Applicable in semester examinations and viva evaluations.',
        },
      ],
      howToSolve: [
        {
          id: 'step-1',
          step: 'Step 1: Problem Diagnosis & Identification',
          detail: `Identify the specific scenario constraints and core parameters related to ${opts.topicTitle}.`,
          questionType: 'Analytical University Question / Case Study',
        },
        {
          id: 'step-2',
          step: 'Step 2: Methodological Application',
          detail: 'Apply the governing theoretical framework systematically.',
          questionType: 'Analytical University Question / Case Study',
        },
        {
          id: 'step-3',
          step: 'Step 3: Managerial Conclusion',
          detail: 'Provide a structured recommendation supported by quantitative or conceptual evidence.',
          questionType: 'Analytical University Question / Case Study',
        },
      ],
    })
  }

  return { content: parsed.data, provider, tokensIn, tokensOut }
}

// ── GET /subjects ────────────────────────────────────────────────────────────
// Publicly lists prep subjects. Filterable by program (e.g. 'bba'), stream, and yearGroup.
router.get('/subjects', async (req, res) => {
  try {
    const { program, stream, yearGroup, degreeLevel } = req.query
    const snap = await db.collection('prep_subjects').get()

    let subjects: PrepSubject[] = snap.docs.map((d) => {
      const data = d.data() as any
      return {
        ...data,
        id: d.id,
      }
    })

    // Non-superadmin sees only published
    const isSuperadmin = (req as any).user?.role === 'superadmin'
    if (!isSuperadmin) {
      subjects = subjects.filter((s) => s.status === 'published')
    }

    if (typeof program === 'string' && program.trim()) {
      const p = program.toLowerCase().trim()
      subjects = subjects.filter((s) => s.programs?.some((prog: string) => prog.toLowerCase() === p))
    }

    if (typeof stream === 'string' && stream.trim()) {
      const st = stream.toLowerCase().trim()
      subjects = subjects.filter((s) => s.stream?.toLowerCase() === st)
    }

    if (typeof yearGroup === 'string' && yearGroup.trim()) {
      const yg = yearGroup.toLowerCase().trim()
      subjects = subjects.filter((s) => s.yearGroup?.toLowerCase() === yg)
    }

    if (typeof degreeLevel === 'string' && degreeLevel.trim() && degreeLevel !== 'all') {
      const lvl = degreeLevel.toLowerCase().trim()
      // effectiveDegreeLevel infers 'undergraduate' for legacy records (BBA)
      // that predate the degreeLevel field.
      subjects = subjects.filter((s) => effectiveDegreeLevel(s) === lvl)
    }

    subjects.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    res.json({ success: true, count: subjects.length, data: subjects })
  } catch (err: any) {
    console.error('[Prep] GET /subjects error:', err)
    res.status(500).json({ error: 'Failed to fetch prep subjects', detail: err.message })
  }
})

// ── GET /subjects/:subjectId ────────────────────────────────────────────────
router.get('/subjects/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params
    const doc = await db.collection('prep_subjects').doc(subjectId).get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Subject not found' })
      return
    }
    const data = doc.data() as any
    res.json({ success: true, data: { ...data, id: doc.id } })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch subject', detail: err.message })
  }
})

// ── GET /subjects/:subjectId/topics ─────────────────────────────────────────
router.get('/subjects/:subjectId/topics', async (req, res) => {
  try {
    const { subjectId } = req.params
    const snap = await db.collection('prep_subjects').doc(subjectId).collection('topics').get()

    let topics = snap.docs.map((d) => {
      const data = d.data() as any
      return {
        ...data,
        id: d.id,
      }
    })

    const isSuperadmin = (req as any).user?.role === 'superadmin'
    if (!isSuperadmin) {
      topics = topics.filter((t) => t.status === 'published')
    }

    topics.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    res.json({ success: true, count: topics.length, data: topics })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list topics', detail: err.message })
  }
})

// ── GET /subjects/:subjectId/topics/:topicId ────────────────────────────────
router.get('/subjects/:subjectId/topics/:topicId', async (req, res) => {
  try {
    const { subjectId, topicId } = req.params
    const doc = await db.collection('prep_subjects').doc(subjectId).collection('topics').doc(topicId).get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Topic not found' })
      return
    }

    const data = doc.data() as any
    const topic = { ...data, id: doc.id }
    res.json({ success: true, data: topic })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch topic', detail: err.message })
  }
})

// ── POST /content/draft (Superadmin only) ────────────────────────────────────
router.post('/content/draft', verifyAuth, aiGenerationLimiter, async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return

  const { subjectId, topicId, title, stream, difficulty, program } = req.body
  if (!subjectId || !topicId || !title) {
    res.status(400).json({ error: 'Missing required fields: subjectId, topicId, title.' })
    return
  }

  try {
    // Check if subject exists
    const subjDoc = await db.collection('prep_subjects').doc(subjectId).get()
    const subjData = subjDoc.data() as PrepSubject | undefined
    const subjectName = subjData?.name || subjectId

    // Generate through AI cascade
    const { content, provider, tokensIn, tokensOut } = await generateDraftWithProviders({
      subjectName,
      topicTitle: title,
      stream: stream || subjData?.stream || 'management',
      difficulty: difficulty || 'core',
      program: program || subjData?.programs?.[0] || 'bba',
    })

    const now = new Date().toISOString()
    const topicRef = db.collection('prep_subjects').doc(subjectId).collection('topics').doc(topicId)
    const existing = (await topicRef.get()).data() || {}

    const updatedTopic: PrepTopic = {
      id: topicId,
      subjectId,
      title: title.trim(),
      order: Number(existing.order) || 1,
      difficulty: difficulty || existing.difficulty || 'core',
      tier: existing.tier || 'free',
      status: 'draft',
      generatedBy: 'ai-draft',
      contentVersion: (Number(existing.contentVersion) || 0) + 1,
      featuredQuestionIds: existing.featuredQuestionIds || [],
      explanationMd: content.explanationMd,
      formulas: content.formulas,
      tricks: content.tricks,
      howToSolve: content.howToSolve,
      updatedAt: now,
    }

    await topicRef.set(updatedTopic, { merge: true })

    // Track AI token usage into daily telemetry doc
    if (tokensIn > 0 || tokensOut > 0) {
      const usageRef = db.collection('ai_usage').doc(todayDateId())
      await usageRef.set(
        {
          generations: FieldValue.increment(1),
          tokensIn: FieldValue.increment(tokensIn),
          tokensOut: FieldValue.increment(tokensOut),
          lastEventAt: now,
        },
        { merge: true }
      ).catch(() => {})
    }

    res.json({
      success: true,
      message: 'Draft generated successfully.',
      provider,
      tokensIn,
      tokensOut,
      data: updatedTopic,
    })
  } catch (err: any) {
    console.error('[Prep] POST /content/draft error:', err)
    res.status(500).json({ error: 'Failed to generate prep draft', detail: err.message })
  }
})

// ── POST /content/publish (Superadmin only) ──────────────────────────────────
router.post('/content/publish', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return

  const { subjectId, topicId } = req.body
  if (!subjectId || !topicId) {
    res.status(400).json({ error: 'subjectId and topicId are required.' })
    return
  }

  try {
    const topicRef = db.collection('prep_subjects').doc(subjectId).collection('topics').doc(topicId)
    const snap = await topicRef.get()
    if (!snap.exists) {
      res.status(404).json({ error: 'Topic not found.' })
      return
    }

    const current = snap.data() as PrepTopic
    const check = validatePublishTransition(current.status, 'published')
    if (!check.allowed) {
      res.status(400).json({ error: check.reason })
      return
    }

    const now = new Date().toISOString()
    await topicRef.update({
      status: 'published',
      publishedAt: now,
      reviewedBy: req.user!.uid,
      updatedAt: now,
    })

    // Recount published topics in subject
    const topicsSnap = await db.collection('prep_subjects').doc(subjectId).collection('topics').get()
    const publishedCount = topicsSnap.docs.filter((d) => d.data().status === 'published').length
    await db.collection('prep_subjects').doc(subjectId).update({
      topicCount: publishedCount,
      updatedAt: now,
    })

    res.json({
      success: true,
      message: 'Topic published successfully.',
      topicId,
      publishedCount,
    })
  } catch (err: any) {
    console.error('[Prep] POST /content/publish error:', err)
    res.status(500).json({ error: 'Failed to publish topic', detail: err.message })
  }
})

// ── POST /content/save (Superadmin curator edits) ────────────────────────────
router.post('/content/save', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return

  const { subjectId, topicId, ...fields } = req.body
  if (!subjectId || !topicId) {
    res.status(400).json({ error: 'subjectId and topicId are required.' })
    return
  }

  try {
    const topicRef = db.collection('prep_subjects').doc(subjectId).collection('topics').doc(topicId)
    const now = new Date().toISOString()

    const payload = {
      ...fields,
      id: topicId,
      subjectId,
      generatedBy: 'curator',
      reviewedBy: req.user!.uid,
      updatedAt: now,
    }

    await topicRef.set(payload, { merge: true })
    res.json({ success: true, message: 'Topic saved successfully.', data: payload })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save topic', detail: err.message })
  }
})

// ── POST /subjects (Superadmin CRUD) ────────────────────────────────────────
router.post('/subjects', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return

  const { id, name, stream, programs, yearGroup, icon, order, status, description } = req.body
  if (!id || !name || !stream) {
    res.status(400).json({ error: 'id, name, and stream are required.' })
    return
  }

  try {
    const now = new Date().toISOString()
    const subjectData: PrepSubject = {
      id: id.trim(),
      name: name.trim(),
      stream,
      programs: Array.isArray(programs) ? programs : ['bba'],
      yearGroup: yearGroup || '1st-year',
      icon: icon || 'BookOpen',
      order: Number(order) || 1,
      topicCount: 0,
      status: status || 'published',
      description: description || '',
      updatedAt: now,
    }

    await db.collection('prep_subjects').doc(id.trim()).set(subjectData, { merge: true })
    res.json({ success: true, message: 'Subject saved successfully.', data: subjectData })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save subject', detail: err.message })
  }
})

// ── GET /practice (Randomly sample questions from approved pool) ────────────
router.get('/practice', async (req, res) => {
  try {
    const topicId = String(req.query.topicId || '').trim()
    const subjectId = String(req.query.subjectId || '').trim()
    const count = Number(req.query.count) || 10

    let query: FirebaseFirestore.Query = db.collection('universalQuestions').where('status', '==', 'approved')

    if (topicId) {
      query = query.where('prepTags.topicIds', 'array-contains', topicId)
    } else if (subjectId) {
      query = query.where('prepTags.subjectId', '==', subjectId)
    }

    const snap = await query.get()
    let pool: UniversalQuestion[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<UniversalQuestion, 'id'>),
    }))

    // If pool is empty or low, check seeded fallback questions
    if (pool.length === 0) {
      const seededMatches = SEEDED_UNIVERSAL_QUESTIONS.filter(
        (q) =>
          (!topicId || q.prepTags.topicIds.includes(topicId)) ||
          (!subjectId || q.prepTags.subjectId === subjectId)
      )
      if (seededMatches.length > 0) {
        pool = seededMatches
      } else {
        // Fallback generic questions for this topic
        pool = [
          {
            id: `practice-${topicId || 'generic'}-1`,
            questionText: `Which fundamental principle is central to understanding ${topicId.replace(/-/g, ' ') || 'management'}?`,
            options: [
              'Systematic alignment of organizational objectives with operational processes',
              'Maximizing short-term discretionary cash outflows without control',
              'Ignoring regulatory frameworks and university standards',
              'Disregarding double-entry equilibrium and internal audit checks',
            ],
            correctIndex: 0,
            explanation: 'Academic frameworks emphasize aligning operational actions systematically with strategic enterprise goals.',
            difficulty: 'core',
            status: 'approved',
            prepTags: { subjectId: subjectId || 'general', topicIds: [topicId] },
          },
          {
            id: `practice-${topicId || 'generic'}-2`,
            questionText: `When analyzing practical problems in this domain, what is the primary initial step?`,
            options: [
              'Execute random computations without reviewing given parameters',
              'Extract given quantitative data, identify governing equations, and state assumptions',
              'Skip the problem statement and guess the final conclusion',
              'Assume all variables are zero regardless of the context',
            ],
            correctIndex: 1,
            explanation: 'Methodological rigor requires extracting given data and selecting the governing formula before calculation.',
            difficulty: 'basic',
            status: 'approved',
            prepTags: { subjectId: subjectId || 'general', topicIds: [topicId] },
          },
        ]
      }
    }

    const sampled = samplePracticeQuestions(pool, count)
    res.json({
      success: true,
      topicId: topicId || null,
      subjectId: subjectId || null,
      count: sampled.length,
      data: sampled,
    })
  } catch (err: any) {
    console.error('[Prep] GET /practice error:', err)
    res.status(500).json({ error: 'Failed to fetch practice questions', detail: err.message })
  }
})

// ── GET /progress (Signed in learner) ────────────────────────────────────────
router.get('/progress', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid
    const doc = await db.collection('prep_progress').doc(uid).get()
    const progress = doc.exists ? doc.data() : { topicsCompleted: {} }
    res.json({ success: true, data: progress })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch learner progress', detail: err.message })
  }
})

// ── POST /progress (Signed in learner) ───────────────────────────────────────
router.post('/progress', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid
    const { topicId, visitedTab, quizScore, quizTotal, completed } = req.body
    if (!topicId) {
      res.status(400).json({ error: 'topicId is required.' })
      return
    }

    const progressRef = db.collection('prep_progress').doc(uid)
    const snap = await progressRef.get()
    const current = snap.exists ? (snap.data() || {}) : {}
    const topicsMap = current.topicsCompleted || {}

    const existing = topicsMap[topicId] || {}
    const visitedSet = new Set<string>(existing.visitedTabs || [])
    if (visitedTab) visitedSet.add(visitedTab)

    const updatedTopicProgress = {
      ...existing,
      lastVisitedAt: new Date().toISOString(),
      visitedTabs: Array.from(visitedSet),
      ...(completed !== undefined ? { completed: Boolean(completed) } : {}),
      ...(quizScore !== undefined ? { quizScore, quizTotal, quizCompletedAt: new Date().toISOString() } : {}),
    }

    topicsMap[topicId] = updatedTopicProgress

    await progressRef.set(
      {
        uid,
        topicsCompleted: topicsMap,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    res.json({ success: true, data: updatedTopicProgress })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record progress', detail: err.message })
  }
})

// ── POST /auth/init (B2C learner role self-initialization) ────────────────────
router.post('/auth/init', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid
    const userRecord = await auth.getUser(uid)
    const existingClaims = (userRecord.customClaims || {}) as Record<string, unknown>

    // If account has no role claim, grant 'student' role (B2C learner, collegeId: null)
    let role = existingClaims.role as string | undefined
    if (!role) {
      await auth.setCustomUserClaims(uid, {
        ...existingClaims,
        role: 'student',
        collegeId: null,
      })
      role = 'student'
    }

    // Upsert into users/{uid}
    const userDocRef = db.collection('users').doc(uid)
    const userSnap = await userDocRef.get()
    if (!userSnap.exists) {
      await userDocRef.set({
        uid,
        email: userRecord.email || null,
        name: userRecord.displayName || 'B2C Student',
        role: 'student',
        collegeId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      uid,
      role,
      collegeId: null,
      message: 'B2C learner identity initialised successfully.',
    })
  } catch (err: any) {
    console.error('[Prep] POST /auth/init error:', err)
    res.status(500).json({ error: 'Failed to initialise learner identity', detail: err.message })
  }
})

// ── POST /seed-bba (Superadmin one-click curriculum population) ──────────────
router.post('/seed-bba', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return

  try {
    const batch = db.batch()
    let subjectCount = 0
    let topicCount = 0
    let questionCount = 0

    // 1. Seed Subjects
    for (const subj of BBA_SUBJECTS) {
      const ref = db.collection('prep_subjects').doc(subj.id)
      batch.set(ref, subj, { merge: true })
      subjectCount++
    }

    // 2. Seed Topics
    for (const [subjectId, topics] of Object.entries(SEEDED_BBA_TOPICS)) {
      for (const topic of topics) {
        const topicRef = db.collection('prep_subjects').doc(subjectId).collection('topics').doc(topic.id)
        batch.set(topicRef, topic, { merge: true })
        topicCount++
      }
    }

    // 3. Seed Practice Questions
    for (const q of SEEDED_UNIVERSAL_QUESTIONS) {
      const qRef = db.collection('universalQuestions').doc(q.id)
      batch.set(qRef, q, { merge: true })
      questionCount++
    }

    await batch.commit()

    res.json({
      success: true,
      message: `Seeded BBA catalog: ${subjectCount} subjects, ${topicCount} full topics, and ${questionCount} universal practice questions.`,
      subjectCount,
      topicCount,
      questionCount,
    })
  } catch (err: any) {
    console.error('[Prep] POST /seed-bba error:', err)
    res.status(500).json({ error: 'Failed to seed BBA catalog', detail: err.message })
  }
})

// ── POST /seed-all (Superadmin master curriculum population) ─────────────────
//
// One-click population of every program that ships with seed data, or a chosen
// subset. Accepts:
//   { "programs": "all" }                 → every program (default)
//   { "programs": "ba,mcom" }             → comma separated codes
//   { "programs": ["ba", "bsc"] }         → array of codes
//   { "programs": "undergraduate" }       → every UG program in the catalog
//
// Writes are accumulated and committed in chunks of FIRESTORE_BATCH_LIMIT to
// stay under Firestore's 500-writes-per-commit ceiling. Every write uses
// { merge: true } so re-running the seeder refreshes content in place.
//
// Each selected catalog is also passed through validatePrepCatalog() and the
// integrity report is returned, so the operator can see any referential gap
// without a separate round trip.
router.post('/seed-all', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return

  try {
    const body = req.body || {}
    const requested = body.programs ?? body.program ?? 'all'

    // Allow selecting by degree level as well as by explicit program codes.
    const seedableCodes = PREP_SEED_BUNDLES.map((b) => b.code)
    const asLevel = typeof requested === 'string' ? requested.trim().toLowerCase() : ''
    const byLevel =
      asLevel === 'undergraduate' || asLevel === 'postgraduate'
        ? getPrepProgramsForLevel(asLevel)
            .map((p) => p.code)
            .filter((code) => seedableCodes.includes(code))
        : null

    const selection = resolveSeedPrograms(byLevel ?? requested)
    // Honour the caller's ordering rather than the registry's, so a chosen
    // subset seeds in exactly the sequence requested.
    const bundles = selection.programs
      .map((code) => PREP_SEED_BUNDLES.find((b) => b.code === code))
      .filter((b): b is (typeof PREP_SEED_BUNDLES)[number] => Boolean(b))
    // Valid program codes that simply have no seed bundle yet.
    const unseedable = selection.programs.filter((code) => !seedableCodes.includes(code))

    if (selection.errors.length > 0 && bundles.length === 0) {
      res.status(400).json({
        error: 'No seedable programs matched the request.',
        errors: selection.errors,
        available: seedableCodes,
      })
      return
    }

    if (bundles.length === 0) {
      res.status(400).json({
        error: 'The requested programs have no seed data yet.',
        errors: selection.errors,
        unseedable,
        available: seedableCodes,
      })
      return
    }

    // Stage every write up front so counts are exact and chunks are uniform.
    type StagedWrite = { ref: FirebaseFirestore.DocumentReference; data: Record<string, any> }
    const writes: StagedWrite[] = []
    const perProgram: Array<{
      code: string
      label: string
      subjectCount: number
      topicCount: number
      questionCount: number
      valid: boolean
      errorCount: number
      warningCount: number
    }> = []

    for (const bundle of bundles) {
      const report = validatePrepCatalog({
        programCode: bundle.code,
        subjects: bundle.subjects,
        topics: bundle.topics,
        questions: bundle.questions,
      })

      let subjectCount = 0
      let topicCount = 0
      let questionCount = 0

      for (const subj of bundle.subjects) {
        writes.push({ ref: db.collection('prep_subjects').doc(subj.id), data: subj as any })
        subjectCount++
      }

      for (const [subjectId, topics] of Object.entries(bundle.topics)) {
        for (const topic of topics) {
          writes.push({
            ref: db.collection('prep_subjects').doc(subjectId).collection('topics').doc(topic.id),
            data: topic as any,
          })
          topicCount++
        }
      }

      for (const q of bundle.questions) {
        writes.push({ ref: db.collection('universalQuestions').doc(q.id), data: q as any })
        questionCount++
      }

      perProgram.push({
        code: bundle.code,
        label: bundle.label,
        subjectCount,
        topicCount,
        questionCount,
        valid: report.valid,
        errorCount: report.errorCount,
        warningCount: report.warningCount,
      })
    }

    // Commit in chunks; Firestore rejects batches larger than 500 writes.
    const chunks = chunkArray(writes, FIRESTORE_BATCH_LIMIT)
    for (const chunk of chunks) {
      const batch = db.batch()
      for (const w of chunk) batch.set(w.ref, w.data, { merge: true })
      await batch.commit()
    }

    const totals = perProgram.reduce(
      (acc, p) => ({
        subjectCount: acc.subjectCount + p.subjectCount,
        topicCount: acc.topicCount + p.topicCount,
        questionCount: acc.questionCount + p.questionCount,
      }),
      { subjectCount: 0, topicCount: 0, questionCount: 0 }
    )

    res.json({
      success: true,
      message: `Seeded ${bundles.length} program(s): ${totals.subjectCount} subjects, ${totals.topicCount} topics and ${totals.questionCount} universal practice questions across ${chunks.length} commit(s).`,
      programs: selection.programs,
      errors: selection.errors,
      unseedable,
      ...totals,
      perProgram,
      writes: writes.length,
      commits: chunks.length,
    })
  } catch (err: any) {
    console.error('[Prep] POST /seed-all error:', err)
    res.status(500).json({ error: 'Failed to seed prep catalog', detail: err.message })
  }
})
