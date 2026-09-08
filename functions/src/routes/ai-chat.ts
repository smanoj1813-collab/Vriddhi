// functions/src/routes/ai-chat.ts
import * as express from 'express'
import { db } from '../config/firebase'
import { verifyAuth, AuthenticatedRequest, resolveCollegeId } from '../middleware/auth'
import { aiGenerationLimiter } from '../middleware/rateLimit'
import { geminiClient, openaiClient, deepseekClient } from '../config/aiProviders'

const router = express.Router()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

router.post('/chat', verifyAuth, aiGenerationLimiter, async (req: AuthenticatedRequest, res: express.Response) => {
  const { messages, context } = req.body as { messages: ChatMessage[]; context?: Record<string, unknown> }
  const user = req.user!
  const collegeId = resolveCollegeId(req)

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  const lastUserMessage = messages[messages.length - 1]?.content || ''

  try {
    // 1. Gather live contextual summary based on role & collegeId
    const role = user.role || 'student'
    let contextSummary = `User Info: Role=${role}, Name=${user.name || user.email || 'User'}, CollegeId=${collegeId || 'N/A'}`

    if (collegeId) {
      if (['admin', 'principal', 'hod', 'superadmin'].includes(role)) {
        // Fetch quick admin stats
        try {
          const studentsSnap = await db.collection(`colleges/${collegeId}/students`).limit(50).get()
          const facultySnap = await db.collection(`colleges/${collegeId}/faculty`).limit(50).get()
          const attendanceSnap = await db.collection(`colleges/${collegeId}/attendanceSummary`).limit(50).get()

          let lowAttendanceCount = 0
          attendanceSnap.forEach(doc => {
            const data = doc.data()
            if (data.percentage !== undefined && data.percentage < 75) {
              lowAttendanceCount++
            }
          })

          contextSummary += `\nCollege Live Snapshot:\n- Total Students Sampled: ${studentsSnap.size}\n- Faculty Count: ${facultySnap.size}\n- Students with Attendance < 75%: ${lowAttendanceCount}`
        } catch (e) {
          console.warn('[AI Chat] Failed to load admin live context', e)
        }
      } else if (role === 'faculty') {
        try {
          const papersSnap = await db.collection(`colleges/${collegeId}/papers`).where('createdBy', '==', user.uid).limit(10).get()
          contextSummary += `\nFaculty Context:\n- Created Papers: ${papersSnap.size}`
        } catch (e) {
          console.warn('[AI Chat] Failed to load faculty live context', e)
        }
      }
    }

    if (context) {
      contextSummary += `\nClient State Context: ${JSON.stringify(context).slice(0, 500)}`
    }

    const systemPrompt = `You are Vriddhi AI, an intelligent, helpful, and concise academic AI assistant embedded inside the Vriddhi Higher Education ERP platform.
You assist Students, Faculty, Principals, and Administrators.

Current Context:
${contextSummary}

Guidelines:
1. Provide accurate, professional, well-formatted markdown answers.
2. If the user asks about attendance, grades, exams, fees, or timetable, ground your answers in the provided context and guide them to relevant portal features when helpful.
3. If assisting with question drafting or syllabus topics, provide clear explanations with examples or Bloom's taxonomy alignment.
4. Always be encouraging, polite, and educational.`

    // 2. Try LLM providers
    let replyText = ''

    // Try Gemini
    const gemini = geminiClient()
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        })
        const formattedHistory = messages.slice(0, -1).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))
        const chat = model.startChat({ history: formattedHistory })
        const result = await chat.sendMessage(lastUserMessage)
        replyText = result.response.text()
      } catch (err) {
        console.warn('[AI Chat] Gemini call failed, trying next provider:', err)
      }
    }

    // Try DeepSeek / OpenAI if Gemini did not produce reply
    if (!replyText) {
      const deepseek = deepseekClient()
      const openai = openaiClient()
      const client = deepseek || openai
      const model = deepseek ? 'deepseek-chat' : 'gpt-4o-mini'

      if (client) {
        try {
          const completion = await client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 1000,
          })
          replyText = completion.choices[0]?.message?.content || ''
        } catch (err) {
          console.warn('[AI Chat] OpenAI/DeepSeek call failed:', err)
        }
      }
    }

    // Grounded fallback if no LLM provider is reachable
    if (!replyText) {
      replyText = generateGroundedFallbackResponse(role, lastUserMessage, contextSummary)
    }

    res.json({
      success: true,
      message: {
        role: 'assistant',
        content: replyText,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[AI Chat] Error in /chat:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal AI Chat error',
    })
  }
})

function generateGroundedFallbackResponse(role: string, query: string, contextSummary: string): string {
  const q = query.toLowerCase()

  if (q.includes('attendance') || q.includes('defaulter') || q.includes('shortage')) {
    if (role === 'student') {
      return `### 📊 Your Attendance Summary\n\nYour attendance records are tracked in real time. \n- Make sure your overall attendance remains above **75%** to comply with university examination criteria.\n- You can view detailed subject-wise lecture breakdowns and leave requests in the **Student Attendance Portal**.`
    }
    return `### 📊 Attendance & Defaulter Intelligence\n\nBased on your institutional records:\n- Mandatory threshold: **75% minimum**.\n- Defaulter notifications can be issued directly from **Faculty Announcements** or reviewed in **HOD Dashboard / View360**.\n\n*Tip: Filter student cohorts by Batch and Branch in View360 for targeted interventions.*`
  }

  if (q.includes('fee') || q.includes('payment') || q.includes('due')) {
    if (role === 'student') {
      return `### 💳 Fee Status & Receipts\n\nYou can review pending semester fees, view past receipts, and download fee clearance certificates directly in the **Student Fee Portal**.`
    }
    return `### 💳 Institutional Fee Tracking\n\nFee collections and pending balances across batches can be monitored in **Admin Fee Management** and **Subscription Billing** with CSV export options.`
  }

  if (q.includes('exam') || q.includes('paper') || q.includes('test') || q.includes('question')) {
    return `### 📝 Examination & Question Bank Engine\n\nVriddhi provides comprehensive assessment tools:\n1. **Universal Question Bank**: Multi-difficulty questions classified by Bloom's Taxonomy.\n2. **Paper Generator & Visual Builder**: Create semester exams or practice quizzes with automated marks distribution.\n3. **PDF Preview & Export**: Download formatted university-grade question papers with customized college headers.`
  }

  if (q.includes('library') || q.includes('book')) {
    return `### 📚 Digital Library Management\n\n- Track available titles and issued copies.\n- Automatic due-date tracking and return processing.\n- Check issued books in the **Faculty / Student Library** view.`
  }

  return `### 🤖 Vriddhi AI Assistant\n\nI am your intelligent assistant for Vriddhi ERP. Here is what I can help you with:\n\n- **Academic Analytics**: Attendance trends, pass percentages, and subject performance.\n- **Assessment Support**: Drafting questions, structuring question papers, and Bloom's taxonomy guidance.\n- **Operations & Scheduling**: Timetables, rescheduled classes, and academic calendar events.\n- **Student Services**: Fee status, library books, and study assistance.\n\n*How can I assist you with your queries today?*`
}

export { router }
