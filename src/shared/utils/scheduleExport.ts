// src/shared/utils/scheduleExport.ts
// ─── Schedule PDF + Image exports — daily & weekly, for admin/principal ─────
//
// Two render paths, same contract as the paper PDF pipeline (pdfDownloader):
//   1) Server Puppeteer route POST /api/schedules/export/pdf → application/pdf (preferred)
//   2) Client fallback via this module (jspdf + html2canvas) when server replies 503 {fallback:'client'}
//
// Image (PNG) is always captured client-side via html2canvas on the printable DOM node.
//
// The printable HTML (what both renderers consume) is deliberately minimal — a
// single <table> with inline styles so html2canvas faithful and Puppeteer deterministic.

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { WeeklyClassSchedule } from '@/modules/admin/types/schedule'
import type { DayOfWeek } from './timetableConflicts'

export type ExportMode = 'daily' | 'weekly'

export interface ScheduleExportOptions {
  collegeName?: string
  title?: string
  subtitle?: string
  day?: DayOfWeek // required for daily
  weekLabel?: string // e.g. "Week of 9 Sep 2026"
}

const DAYS: DayOfWeek[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_FULL: Record<string,string> = {
  monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday',
  friday:'Friday', saturday:'Saturday', sunday:'Sunday'
}

function dayLabel(d: string): string {
  return DAY_FULL[d.toLowerCase()] || d
}

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80)
}

function formatSchedulesForExport(
  schedules: WeeklyClassSchedule[] | Array<{ dayOfWeek: string; startTime: string; endTime: string; subject: string; subjectCode?: string; facultyName: string; branch?: string; batch?: string; division?: string; room?: string; type?: string }>,
  day?: DayOfWeek
): typeof schedules {
  if (!day) return [...schedules].sort((a,b)=> DAYS.indexOf(a.dayOfWeek as DayOfWeek) - DAYS.indexOf(b.dayOfWeek as DayOfWeek) || a.startTime.localeCompare(b.startTime))
  const filtered = schedules.filter(s => s.dayOfWeek?.toLowerCase() === day.toLowerCase())
  return filtered.sort((a,b)=> a.startTime.localeCompare(b.startTime))
}

// ─── 1) Client PDF via jspdf (fallback + offline) ────────────────────────────

export interface SchedulePdfData {
  mode: ExportMode
  schedules: WeeklyClassSchedule[] | any[]
  options: ScheduleExportOptions
}

export function toSchedulePdfBlob(data: SchedulePdfData): Blob {
  const orientation: 'l' | 'p' = data.mode === 'weekly' ? 'l' : 'p'
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 28
  const usableW = pageW - margin * 2

  let y = margin

  const drawHeader = () => {
    doc.setFont('helvetica','bold'); doc.setFontSize(14)
    const title = data.options.title || (data.mode === 'daily'
      ? `Daily Class Schedule — ${dayLabel(data.options.day || '')}`
      : `Weekly Class Schedule`)
    doc.text(title, margin, y); y += 16
    if (data.options.collegeName) {
      doc.setFont('helvetica','normal'); doc.setFontSize(10)
      doc.text(data.options.collegeName, margin, y); y += 12
    }
    if (data.options.subtitle || data.options.weekLabel) {
      doc.setFont('helvetica','normal'); doc.setFontSize(9)
      doc.text(data.options.subtitle || data.options.weekLabel || '', margin, y); y += 12
    }
    doc.setFontSize(8); doc.setTextColor(80)
    doc.text(`Generated ${new Date().toLocaleString('en-IN')} • Vriddhi`, margin, y)
    doc.setTextColor(0)
    y += 14
  }

  drawHeader()

  if (data.mode === 'daily') {
    const rows = formatSchedulesForExport(data.schedules as any, data.options.day)
    if (rows.length === 0) {
      doc.setFont('helvetica','italic'); doc.setFontSize(10)
      doc.text('No classes scheduled for this day.', margin, y)
    } else {
      const headers = ['Time','Subject (Code)','Faculty','Branch / Batch','Room','Type']
      const weights = [1.2, 2.2, 1.6, 1.4, 0.8, 0.8]
      const sumW = weights.reduce((a,b)=>a+b,0)
      const widths = weights.map(w=> (w/sumW)*usableW)

      const drawRow = (cells: string[], bold=false, bg?: [number,number,number]) => {
        const h = 14
        if (y + h > pageH - margin) { doc.addPage(); y = margin; drawHeader(); if (bold) drawRow(headers,true,[241,245,249]) }
        if (bg) { doc.setFillColor(bg[0],bg[1],bg[2]); doc.rect(margin, y-10, usableW, h, 'F') }
        doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(8)
        let x = margin
        cells.forEach((c,i)=>{
          const maxChars = Math.max(6, Math.floor(widths[i]/4.4))
          const t = c.length > maxChars ? c.slice(0,maxChars-1)+'…' : c
          doc.text(t, x+3, y); x+=widths[i]
        })
        y+=h
      }
      drawRow(headers,true,[241,245,249])
      rows.forEach((r: any)=>{
        const time = `${r.startTime}–${r.endTime}`
        const subject = r.subjectCode ? `${r.subject} (${r.subjectCode})` : r.subject
        const branchBatch = [r.branch, r.batch, r.division].filter(Boolean).join(' • ')
        drawRow([time, subject, r.facultyName || r.facultyId, branchBatch, r.room||'—', r.type||'lecture'])
      })
    }
  } else {
    // Weekly matrix: Time column + Mon–Sat columns
    const all = data.schedules as any[]
    const workingDays = DAYS.filter(d => all.some((s:any)=> s.dayOfWeek?.toLowerCase() === d))
    const days = workingDays.length ? workingDays : DAYS.slice(0,6)

    // All unique slots sorted (union of every day's times)
    const slotKeys = Array.from(new Set(all.map((s:any)=> `${s.startTime}–${s.endTime}`))).sort()
    // Map day|slot -> subject label
    const cellMap = new Map<string,string>()
    all.forEach((s:any)=>{
      const key = `${s.dayOfWeek?.toLowerCase()}|${s.startTime}–${s.endTime}`
      const label = `${s.subject}${s.room?` @${s.room}`:''}\n${s.facultyName||''}`
      cellMap.set(key, label)
    })

    // Breaks are rendered as shaded rows — derive by gaps in slotKeys per day vs global?
    // Simpler: shade empty global rows? Instead show breaks as empty cells with —.

    const headers = ['Time', ...days.map(dayLabel)]
    const colW = [usableW*0.13, ...days.map(()=> usableW*0.87/days.length)]
    // widths already in colW
    const drawRow = (cells: string[], bold=false, bg?: [number,number,number]) => {
      const h = bold ? 16 : 22 // weekly cells are taller to fit two lines
      if (y + h > pageH - margin) { doc.addPage(); y = margin; drawHeader(); drawRow(headers,true,[241,245,249]) }
      if (bg) { doc.setFillColor(bg[0],bg[1],bg[2]); doc.rect(margin, y-11, usableW, h, 'F') }
      doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(bold?8:7)
      let x = margin
      cells.forEach((c,i)=>{
        const lines = c.split('\n')
        const maxChars = Math.max(6, Math.floor(colW[i]/4.2))
        lines.forEach((line, li)=>{
          const t = line.length > maxChars ? line.slice(0,maxChars-1)+'…' : line
          doc.text(t, x+3, y + li*8)
        })
        x+=colW[i]
        // vertical grid line
        doc.setDrawColor(225); doc.setLineWidth(0.5)
        doc.line(x, y-11, x, y + h - 12)
      })
      // horizontal line
      doc.line(margin, y + h - 12, margin + usableW, y + h - 12)
      y+=h
    }

    // Header
    drawRow(headers,true,[15,118,110]) // teal header for weekly brand
    if (slotKeys.length===0){
      doc.setFont('helvetica','italic'); doc.setFontSize(10)
      doc.text('No classes scheduled this week.', margin+3, y+2)
    } else {
      slotKeys.forEach(key=>{
        const cells = [key]
        days.forEach(d=>{
          cells.push(cellMap.get(`${d}|${key}`) || '—')
        })
        drawRow(cells,false)
      })
    }
  }

  // Footer branding
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(110)
  doc.text('Vriddhi Academic Cloud — scalable, equal-distribution scheduling', margin, pageH - 12)

  return doc.output('blob')
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(()=> URL.revokeObjectURL(url), 1000)
}

export function schedulePdfFilename(mode: ExportMode, options: ScheduleExportOptions, ext='pdf'): string {
  const prefix = mode === 'daily'
    ? `schedule_daily_${(options.day||'day').toLowerCase()}`
    : 'schedule_weekly'
  const stamp = mode === 'daily'
    ? new Date().toISOString().slice(0,10)
    : `${options.weekLabel ? safeFilename(options.weekLabel) : new Date().toISOString().slice(0,10)}`
  return `${prefix}_${stamp}.${ext}`
}

export async function downloadSchedulePdf(data: SchedulePdfData): Promise<string> {
  const blob = toSchedulePdfBlob(data)
  const filename = schedulePdfFilename(data.mode, data.options)
  triggerDownload(blob, filename)
  return filename
}

// ─── 2) Image (PNG) via html2canvas on a printable node ─────────────────────
//
// Caller passes a ref to a visible DOM node that already renders the schedule
// table (the printable area). We snapshot it at 2× scale for sharpness.

export async function downloadScheduleAsImage(
  element: HTMLElement,
  filename: string,
): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  return a.download
}

export async function downloadScheduleImageFromRef(
  ref: React.RefObject<HTMLElement>,
  mode: ExportMode,
  options: ScheduleExportOptions,
): Promise<string> {
  const el = ref.current
  if (!el) throw new Error('Schedule preview is not ready — try again.')
  const filename = schedulePdfFilename(mode, options, 'png')
  return downloadScheduleAsImage(el, filename)
}

// ─── 3) Server download helper (preferred, with client fallback) ─────────────

import { apiUrl, ApiResponseError } from '@/shared/api/apiBase'
import { readServerPdfResponse } from './pdfDownloader'

async function getToken(): Promise<string> {
  const stored = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('vriddhi_auth_token')
  if (stored) return stored
  try { const { auth } = await import('@/Firebase/config'); if (auth.currentUser) return await auth.currentUser.getIdToken() } catch {}
  return ''
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ServerScheduleExportParams {
  mode: ExportMode
  day?: DayOfWeek
  collegeName?: string
  from?: string
  to?: string
}

/**
 * Try the Puppeteer server PDF first; on 503 {fallback:'client'} render locally.
 * Returns which renderer actually produced the file so the UI can show a subtle notice.
 */
export async function downloadSchedulePdfWithServerFallback(
  localData: SchedulePdfData,
  serverParams?: ServerScheduleExportParams,
): Promise<{ renderedBy: 'server' | 'client'; filename: string }> {
  const url = apiUrl('/schedules/export/pdf')
  const token = await getToken()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(serverParams || { mode: localData.mode, day: localData.options.day, collegeName: localData.options.collegeName }),
    })
    const outcome = await readServerPdfResponse(res, url)
    if (outcome.kind === 'pdf') {
      const filename = schedulePdfFilename(localData.mode, localData.options)
      saveBlob(outcome.blob, filename)
      return { renderedBy: 'server', filename }
    }
    // was fallback signal — fall through to client render
  } catch (err: any) {
    // Network/CORS or server unavailable — still try client fallback before surfacing
    if (err instanceof ApiResponseError && err.message.includes('Expected a PDF')) throw err
    // else swallow to client path
    console.warn('[scheduleExport] server PDF unavailable, using client renderer', err)
  }
  const filename = await downloadSchedulePdf(localData)
  return { renderedBy: 'client', filename }
}
