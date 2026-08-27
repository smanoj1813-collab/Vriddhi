// src/routes/ai-questions.ts
import * as express from 'express'
import { db } from '../config/firebase'
import { verifyAuth, requireRole, AuthenticatedRequest, resolveCollegeId } from '../middleware/auth'
import { checkTier, enforceQuestionLimit, incrementUsage } from '../middleware/tierCheck'
import { aiGenerationLimiter } from '../middleware/rateLimit'
import { FieldValue } from 'firebase-admin/firestore'
import { geminiClient, openaiClient, deepseekClient, getAvailableProviders } from '../config/aiProviders'

const WRITE_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty', 'mentor']
const MAX_SAVE_BATCH = 50

const router = express.Router()

// ─── SHARED GENERATION LOGIC ───
async function handleGenerateQuestions(req: AuthenticatedRequest, res: express.Response) {
  const config = req.body
  const startTime = Date.now()
  const userId = req.user!.uid
  const collegeId = resolveCollegeId(req)

  console.log('[AI Generate] Request:', JSON.stringify({
    userId,
    collegeId: collegeId || 'null',
    topic: config.topic,
    subject: config.subject,
    questionType: config.questionType,
    difficulty: config.difficulty,
    count: config.count,
    numQuestions: config.numQuestions,
  }))

  try {
    // ─── Validate provider availability ───
    const provider = config.provider || 'gemini'
    const availableProviders = getAvailableProviders()

    if (!availableProviders[provider as keyof typeof availableProviders]) {
      res.status(400).json({
        error: `Provider '${provider}' not available. Available: ${Object.keys(availableProviders).filter(k => availableProviders[k as keyof typeof availableProviders]).join(', ')}`
      })
      return
    }

    // ─── Normalize config ───
    const numQuestions = config.count || config.numQuestions || 5
    const normalizedConfig = {
      ...config,
      numQuestions,
      course: config.course || config.courseName || 'B.Com',
      courseId: config.courseId || '',
      courseName: config.courseName || '',
      courseCode: config.courseCode || '',
      curriculumId: config.curriculumId || '',
      moduleId: config.moduleId || '',
      moduleName: config.moduleName || '',
      moduleNo: config.moduleNo || 0,
      language: config.language || 'English',
      branch: config.branch || '',
      batch: config.batch || '',
      chapter: config.chapter || '',
      unit: config.unit || '',
      marks: config.marks || 1,
      learningOutcomes: config.learningOutcomes || [],
      topics: config.topics || [],
      // Map assessment types -> AI prompt types
      questionType: mapQuestionTypeForAI(config.questionType || 'mcq'),
    }

    let rawResponse: string

    if (provider === 'gemini') {
      const client = geminiClient()
      if (!client) {
        res.status(500).json({ error: 'Gemini client not initialized. Check GEMINI_API_KEY.' })
        return
      }
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(buildPrompt(normalizedConfig))
      rawResponse = result.response.text()
    }
    else if (provider === 'openai') {
      const client = openaiClient()
      if (!client) {
        res.status(500).json({ error: 'OpenAI client not initialized. Check OPENAI_API_KEY.' })
        return
      }
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: buildPrompt(normalizedConfig) }],
        response_format: { type: 'json_object' },
      })
      rawResponse = completion.choices[0].message.content || ''
    }
    else if (provider === 'deepseek') {
      const client = deepseekClient()
      if (!client) {
        res.status(500).json({ error: 'DeepSeek client not initialized. Check DEEPSEEK_API_KEY.' })
        return
      }
      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: buildPrompt(normalizedConfig) }],
        response_format: { type: 'json_object' },
      })
      rawResponse = completion.choices[0].message.content || ''
    }
    else {
      res.status(400).json({ error: `Unsupported provider: ${provider}` })
      return
    }

    console.log('[AI Generate] Raw response length:', rawResponse.length)

    // ─── Strip markdown code blocks ───
    let cleanedResponse = rawResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    // ─── Parse response ───
    let parsed: any
    try {
      parsed = JSON.parse(cleanedResponse)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr)
      console.error('Raw response preview:', rawResponse.substring(0, 1000))
      res.status(500).json({
        error: 'Failed to parse AI response',
        rawResponse: rawResponse.substring(0, 500),
      })
      return
    }

    const questions = Array.isArray(parsed) ? parsed : parsed.questions || []

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(500).json({
        error: 'AI returned no questions',
        rawResponse: rawResponse.substring(0, 500),
      })
      return
    }

    console.log('[AI Generate] Parsed', questions.length, 'questions')

    // ─── Build generationConfig with no undefined values ───
    const generationConfig = {
      difficulty: normalizedConfig.difficulty,
      questionType: normalizedConfig.questionType,
      course: normalizedConfig.course,
      branch: normalizedConfig.branch,
      subject: normalizedConfig.subject,
      topic: normalizedConfig.topic,
      marks: normalizedConfig.marks,
      language: normalizedConfig.language,
      chapter: normalizedConfig.chapter,
      unit: normalizedConfig.unit,
      curriculumId: normalizedConfig.curriculumId,
      courseId: normalizedConfig.courseId,
      courseName: normalizedConfig.courseName,
      courseCode: normalizedConfig.courseCode,
      moduleId: normalizedConfig.moduleId,
      moduleName: normalizedConfig.moduleName,
      moduleNo: normalizedConfig.moduleNo,
      learningOutcomes: normalizedConfig.learningOutcomes,
    }

    // ─── Prepare response data (JSON-safe, NO FieldValue) ───
    const isoNow = new Date().toISOString()
    const responseQuestions = questions.map((q: any, index: number) => {
      const normalized = normalizeQuestion(q, normalizedConfig)
      return {
        ...normalized,
        id: `ai-${Date.now()}-${index}`,
        generatedBy: userId,
        collegeId: collegeId || null,
        provider,
        generationConfig,
        createdAt: isoNow,
        updatedAt: isoNow,
        source: 'ai',
        isAIGenerated: true,
      }
    })

    // Generation does NOT auto-save. The client is responsible for saving the
    // reviewed questions through /api/ai-questions/save or the question bank.
    // This prevents duplicate documents when the UI performs its own save step.

    // ─── Log generation usage ───
    await db.collection('ai_generation_logs').add({
      userId,
      collegeId: collegeId || null,
      provider,
      numQuestions: questions.length,
      config: normalizedConfig,
      generationTime: Date.now() - startTime,
      savedIds: [],
      createdAt: FieldValue.serverTimestamp(),
    })

    // ─── Update tier usage counters ───
    await incrementUsage(userId, questions.length)

    res.json({
      success: true,
      questions: responseQuestions,
      provider,
      generationTime: Date.now() - startTime,
      savedCount: 0,
      savedIds: [],
    })
  } catch (err: any) {
    console.error('[AI Generate] CRITICAL ERROR:', err)
    console.error('[AI Generate] Stack:', err.stack)
    res.status(500).json({
      error: err.message || 'Failed to generate questions',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    })
  }
}

// ─── POST /api/ai-questions/generate ───
// FIX: Removed strict validateRequest to unblock faculty — validation was rejecting valid payloads
// Schema now permissive, but we bypass it entirely for now and rely on handleGenerateQuestions normalization
router.post(
  '/generate',
  verifyAuth,
  requireRole(...WRITE_ROLES),
  checkTier,
  enforceQuestionLimit,
  aiGenerationLimiter,
  handleGenerateQuestions
)

// ─── POST /api/ai/generate-questions (ALIAS for frontend compatibility) ───
router.post(
  '/generate-questions',
  verifyAuth,
  requireRole(...WRITE_ROLES),
  checkTier,
  enforceQuestionLimit,
  aiGenerationLimiter,
  handleGenerateQuestions
)

// ─── POST /api/ai-questions/save ───
router.post(
  '/save',
  verifyAuth,
  requireRole(...WRITE_ROLES),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { questions } = req.body
      const userId = req.user!.uid

      if (!Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({ error: 'Questions array is required' })
        return
      }
      if (questions.length > MAX_SAVE_BATCH) {
        res.status(400).json({ error: `At most ${MAX_SAVE_BATCH} questions per request` })
        return
      }

      const collegeId = resolveCollegeId(req)
      if (!collegeId) {
        res.status(400).json({ error: 'collegeId is required' })
        return
      }

      const batch = db.batch()
      const savedQuestions: any[] = []
      const savedIds: string[] = []
      const now = new Date().toISOString()

      for (const q of questions) {
        if (q.collegeId && q.collegeId !== collegeId && req.user!.role !== 'superadmin') {
          res.status(403).json({ error: 'Forbidden: cross-college save rejected' })
          return
        }

        const existingId = q.firestoreId || q.id
        const isExisting = Boolean(existingId && !String(existingId).startsWith('ai-'))
        const docRef = isExisting
          ? db.collection('questions').doc(String(existingId))
          : db.collection('questions').doc()

        if (isExisting) {
          const existing = await docRef.get()
          if (!existing.exists) {
            res.status(404).json({ error: `Question ${existingId} not found` })
            return
          }
          const existingCollege = existing.data()?.collegeId
          if (existingCollege && existingCollege !== collegeId && req.user!.role !== 'superadmin') {
            res.status(403).json({ error: 'Forbidden: cannot update another college question' })
            return
          }
        }

        const {
          id: _id,
          firestoreId: _fid,
          generatedAt: _g,
          createdBy: _cb,
          createdByName: _cbn,
          collegeId: _cid,
          createdAt: _ca,
          updatedBy: _ub,
          ...rest
        } = q
        const data: Record<string, unknown> = {
          ...rest,
          updatedBy: userId,
          collegeId,
          updatedAt: FieldValue.serverTimestamp(),
          searchKeywords: (rest.searchKeywords || buildSearchKeywords(rest)),
          isAIGenerated: true,
          reviewed: true,
        }
        if (!isExisting) {
          data.createdBy = userId
          data.createdByName = req.user?.name || 'Unknown'
          data.createdAt = now
        }

        if (isExisting) {
          batch.update(docRef, data)
        } else {
          batch.set(docRef, data)
        }
        savedIds.push(docRef.id)
        savedQuestions.push({ ...data, id: docRef.id, firestoreId: docRef.id, collegeId })
      }

      await batch.commit()

      res.status(201).json({
        success: true,
        savedCount: savedQuestions.length,
        importedIds: savedIds,
        createdIds: savedIds,
        questions: savedQuestions,
      })
    } catch (err: any) {
      console.error('Save questions error:', err)
      res.status(500).json({ error: err.message || 'Failed to save questions' })
    }
  }
)

// ─── GET /api/ai-questions/history ───
router.get('/history', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.uid
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    const snapshot = await db
      .collection('ai_generation_logs')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const history = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    res.json({ success: true, history })
  } catch (err: any) {
    console.error('History error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch history' })
  }
})

function buildPrompt(config: any): string {
  // Map to prompt-friendly type
  const aiType = config.questionType || 'mcq'

  const optionFormat =
    aiType === 'mcq'
      ? `, "options": [{"label":"A","text":"Option A text here"}, {"label":"B","text":"Option B text here"}, {"label":"C","text":"Option C text here"}, {"label":"D","text":"Option D text here"}], "correctAnswer": "A"`
      : aiType === 'true_false'
      ? `, "options": [{"label":"A","text":"True"}, {"label":"B","text":"False"}], "correctAnswer": "A"`
      : aiType === 'matching'
      ? `, "options": [{"label":"A","text":"Item A","matchWith":"Match 1"}, {"label":"B","text":"Item B","matchWith":"Match 2"}], "correctAnswer": {"A":"Match 1","B":"Match 2"}`
      : ''

  const moduleInfo = config.moduleName
    ? `Module ${config.moduleNo ? config.moduleNo + ': ' : ''}${config.moduleName}`
    : ''

  const chapterUnitInfo = config.chapter || config.unit
    ? `Chapter: ${config.chapter || 'N/A'}, Unit: ${config.unit || 'N/A'}`
    : ''

  const learningOutcomesInfo = config.learningOutcomes?.length
    ? `Learning Outcomes to cover: ${config.learningOutcomes.join('; ')}`
    : ''

  const topicsInfo = config.topics?.length
    ? `Topics: ${config.topics.join(', ')}`
    : ''

  return `Generate ${config.numQuestions} ${config.difficulty} ${aiType} questions for ${config.course} ${config.branch}, Subject: ${config.subject}, Topic: ${config.topic || config.topics?.[0] || ''}.
${moduleInfo}
${chapterUnitInfo}
${topicsInfo}
${learningOutcomesInfo}

Language: ${config.language}
Marks per question: ${config.marks}

Respond ONLY with a JSON array of questions in this exact format:
[
  {
    "text": "Question text here",
    "explanation": "Detailed explanation of the correct answer",
    "marks": ${config.marks},
    "topic": "${config.topic || config.topics?.[0] || ''}",
    "tags": ["${config.subject}", "${config.topic || ''}", "${config.difficulty}"],
    "difficulty": "${config.difficulty}",
    "questionType": "${aiType}"
    ${optionFormat}
  }
]

Rules:
- Each question must be educationally valuable and clear
- Explanations should be detailed enough for student learning
- Tags should help with categorization and search
- Ensure questions are appropriate for the specified difficulty level
- Return ONLY the JSON array, no additional text`
}

function normalizeQuestion(q: any, config: any): any {
  let options: string[] | undefined
  if (q.options) {
    if (Array.isArray(q.options)) {
      options = q.options.map((opt: any) => {
        if (typeof opt === 'string') return opt
        if (opt && typeof opt === 'object') {
          return opt.text || opt.label || String(opt)
        }
        return String(opt)
      }).filter(Boolean)
    } else if (typeof q.options === 'object' && q.options !== null) {
      options = Object.values(q.options).map((val: any) => {
        return typeof val === 'string' ? val : String(val)
      }).filter(Boolean)
    }
  }

  let correctAnswer = q.correctAnswer
  if (correctAnswer !== undefined && correctAnswer !== null) {
    if (typeof correctAnswer === 'number') {
      correctAnswer = String.fromCharCode(65 + correctAnswer)
    } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
      correctAnswer = correctAnswer.label || correctAnswer.text || 'A'
    } else {
      correctAnswer = String(correctAnswer).trim()
    }
  }

  // Map AI prompt types back to questionBank types
  const rawType = q.type || q.questionType || config.questionType || 'mcq'
  let normalizedType = rawType
  if (rawType === 'mcq_single' || rawType === 'mcq_multiple') normalizedType = 'mcq'
  if (rawType === 'match_following') normalizedType = 'matching'

  return {
    text: q.text || '',
    type: normalizedType,
    difficulty: q.difficulty || config.difficulty || 'medium',
    marks: q.marks || config.marks || 1,
    subject: config.subject || '',
    topic: q.topic || config.topic || '',
    tags: Array.isArray(q.tags) ? q.tags : [config.subject, config.topic, config.difficulty].filter(Boolean),
    options,
    correctAnswer,
    explanation: q.explanation || '',
    unit: q.unit || config.unit || '',
    chapter: q.chapter || config.chapter || '',
    branch: config.branch || '',
    batch: config.batch || '',
    // ═══ Curriculum Linkage ═══
    curriculumId: config.curriculumId || '',
    courseId: config.courseId || '',
    courseName: config.courseName || '',
    courseCode: config.courseCode || '',
    moduleId: config.moduleId || '',
    moduleName: config.moduleName || '',
    moduleNo: config.moduleNo || 0,
    learningOutcomes: config.learningOutcomes || [],
    bloomLevel: q.bloomLevel || config.bloomLevel || '',
    status: 'active',
  }
}

function mapQuestionTypeForAI(type: string): string {
  if (type === 'mcq_single' || type === 'mcq_multiple') return 'mcq'
  if (type === 'match_following') return 'matching'
  return type
}

function buildSearchKeywords(q: any): string[] {
  return [
    q?.text,
    q?.subject,
    q?.topic,
    q?.chapter,
    q?.unit,
    ...(Array.isArray(q?.tags) ? q.tags : []),
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase())
}

export { router }