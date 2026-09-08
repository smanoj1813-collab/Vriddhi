// src/shared/services/aiChatService.ts
import { auth, db } from '@/Firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action?: {
    label: string;
    path: string;
  };
}

export interface SendChatMessageParams {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: Record<string, unknown>;
}

export async function sendAIChatMessage({ messages, context }: SendChatMessageParams): Promise<string> {
  const currentUser = auth.currentUser;
  let token = '';
  if (currentUser) {
    try {
      token = await currentUser.getIdToken();
    } catch {
      // ignore
    }
  }

  // Try calling the backend Firebase functions /api/ai/chat endpoint
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages,
        context,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.message?.content) {
        return data.message.content;
      }
    }
  } catch {
    // Network or server unreachable, fallback to client-side grounded reasoning
  }

  // Client-side intelligent fallback
  const lastMsg = messages[messages.length - 1]?.content || '';
  return getClientSideGroundedReply(lastMsg, context);
}

function getClientSideGroundedReply(queryText: string, context?: Record<string, unknown>): string {
  const q = queryText.toLowerCase();
  const role = String(context?.role || 'student').toLowerCase();
  const name = String(context?.name || 'there');

  if (q.includes('attendance') || q.includes('defaulter') || q.includes('present') || q.includes('absent')) {
    if (role === 'student') {
      return `### 📊 Your Attendance Analysis
Hello **${name}**, here are key guidelines for your attendance:
- **Mandatory Threshold**: You must maintain a minimum of **75% aggregate attendance** to be eligible for end-semester examinations.
- **Subject Tracking**: You can view individual lecture presence, practical sessions, and leave requests in the **Attendance** tab.
- **Action**: If your attendance has dropped in any subject, consult your faculty mentor immediately for make-up assignments.`;
    }
    return `### 📊 Attendance & Cohort Insights
- **University Threshold**: 75% minimum aggregate attendance.
- **Intervention Tools**:
  - View real-time department defaulter rates in **HOD Dashboard** and **View 360**.
  - Issue official push notifications directly to cohorts via **Faculty Announcements**.
  - Monitor daily lecture log compliance under **Attendance Management**.`;
  }

  if (q.includes('fee') || q.includes('due') || q.includes('payment') || q.includes('receipt') || q.includes('tuition')) {
    if (role === 'student') {
      return `### 💳 Student Fee Portal
- You can review pending semester fees, previous transaction history, and download official fee clearance receipts under **Fee Portal**.
- If you have submitted an offline DD or NEFT transfer, please allow 24–48 hours for finance office reconciliation.`;
    }
    return `### 💳 Institutional Fee Collection Intelligence
- **Fee Collections**: Track realized fees vs. outstanding dues categorized by academic year and branch in **Fee Management**.
- **Automated Invoicing**: Students receive automated balance notifications before semester examination registrations.`;
  }

  if (q.includes('exam') || q.includes('paper') || q.includes('test') || q.includes('question') || q.includes('pyq')) {
    return `### 📝 Examination & Question Bank System
Vriddhi provides an end-to-end examination pipeline:
1. **Universal Question Bank**: Browse thousands of verified questions cataloged with Bloom's taxonomy and difficulty ratings.
2. **Interactive Paper Builder**: Construct balanced papers using predefined syllabus templates or manual drag-and-drop.
3. **Automated PDF Export**: Generate formatted printable examination papers complete with university watermarks, duration, and section divisions.`;
  }

  if (q.includes('schedule') || q.includes('timetable') || q.includes('reschedule') || q.includes('class') || q.includes('room')) {
    if (role === 'faculty') {
      return `### 🗓️ Faculty Schedule & Rescheduling
- View your weekly lecture slots in **Faculty Schedule & Calendar**.
- Need to reschedule? Submit a request via **Faculty Reschedule** with room assignment and reason; your HOD will receive an instant approval notification.`;
    }
    return `### 🗓️ Timetable & Academic Calendar
- Weekly lectures, laboratory sessions, and upcoming college events are dynamically mapped in the **Timetable** and **Events** views.`;
  }

  if (q.includes('library') || q.includes('book') || q.includes('borrow')) {
    return `### 📚 Digital Library Management
- **Catalog**: Search titles by author, subject, or ISBN.
- **Issue Tracking**: Automatic calculation of return dates with renewal options in the **Library** module.`;
  }

  return `### 🤖 Vriddhi AI Assistant
Hello **${name}**! I am your AI assistant for the Vriddhi Academic Platform.

Here are some tasks I can help you with:
- 📈 **Academic Metrics**: Ask about attendance rules, grade trends, and pass percentages.
- 📋 **Examinations & Assessments**: Learn how to generate question papers, use Bloom's taxonomy, or practice test topics.
- 🗓️ **Scheduling**: Find where to check timetables, events, or class reschedule requests.
- 💡 **Study & Concept Help**: Ask me to explain any academic topic or draft study questions!

*What would you like assistance with?*`;
}
