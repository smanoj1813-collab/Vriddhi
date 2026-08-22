// src/shared/utils/pdfDownloader.ts
// Backend PDF download helper — fetches generated PDF from the API backend.

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://asia-south1-vriddhi-academic.cloudfunctions.net'
).replace(/\/$/, '') + '/api'

async function getToken(): Promise<string> {
  const stored = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('vriddhi_auth_token');
  if (stored) return stored;
  try {
    const { auth } = await import('@/Firebase/config');
    if (auth.currentUser) return await auth.currentUser.getIdToken();
  } catch {
    // ignore
  }
  return '';
}

/**
 * Download paper as proper text-based PDF from backend
 * GET /api/papers/:id/pdf
 */
export async function downloadPaperPDF(
  paperId: string,
  filename?: string
): Promise<void> {
  const token = await getToken()

  const res = await fetch(`${API_BASE_URL}/papers/${paperId}/pdf`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Failed to download PDF: ${res.status}`)
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename || 'question_paper'}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Download questions list as PDF from backend
 * POST /api/questions/export/pdf
 */
export async function downloadQuestionsPDF(
  questionIds: string[],
  title: string,
  filename?: string
): Promise<void> {
  const token = await getToken()

  const res = await fetch(`${API_BASE_URL}/questions/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ questionIds, title }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Failed to download PDF: ${res.status}`)
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename || 'questions'}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
