// Weekly timetable export (PDF / JPG).
// Renders a days × time-slot grid off-screen, rasterises it with html2canvas
// and saves it either as a JPG or as a landscape A4 PDF (jsPDF). Libraries are
// lazy-loaded through the shared pdfRuntime cache.

import { loadPdfLibs } from './pdfRuntime'
import { escapeHtml } from './pdfGenerator'

export interface TimetableSlot {
  dayOfWeek: string
  startTime: string
  endTime: string
  subject: string
  subjectCode?: string
  facultyName?: string
  room?: string
  branch?: string
  batch?: string
  semester?: number | string
  division?: string
  section?: string
  type?: string
}

export interface TimetableExportOptions {
  title: string
  subtitle?: string
  days: string[]
  slots: TimetableSlot[]
  /** Show branch/batch/sem inside each cell (useful for the all-classes view). */
  showCohort?: boolean
  fileName: string
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function cohortLabel(s: TimetableSlot): string {
  return [
    s.branch,
    s.batch,
    s.semester ? `Sem ${s.semester}` : '',
    [s.division, s.section].filter(Boolean).join(' '),
  ].filter(Boolean).join(' · ')
}

function buildHtml(opts: TimetableExportOptions): string {
  const times = [...new Set(opts.slots.map((s) => `${s.startTime}-${s.endTime}`))].sort()
  const header = times
    .map((t) => `<th style="background:#0f766e;color:#fff;padding:8px 6px;font-size:12px;border:1px solid #0b5e58;min-width:110px">${escapeHtml(t.replace('-', ' – '))}</th>`)
    .join('')
  const rows = opts.days
    .map((day) => {
      const cells = times
        .map((t) => {
          const items = opts.slots.filter((s) => s.dayOfWeek === day && `${s.startTime}-${s.endTime}` === t)
          const inner = items
            .map(
              (s) => `<div style="background:#f0fdfa;border-left:3px solid #14b8a6;border-radius:4px;padding:4px 6px;margin:2px 0;text-align:left">
                <div style="font-weight:700;font-size:12px;color:#0f172a">${escapeHtml(s.subject)}</div>
                ${s.subjectCode ? `<div style="font-size:10px;color:#64748b">${escapeHtml(s.subjectCode)}</div>` : ''}
                ${s.facultyName ? `<div style="font-size:10px;color:#334155">${escapeHtml(s.facultyName)}</div>` : ''}
                <div style="font-size:10px;color:#64748b">${[s.room ? `Room ${escapeHtml(s.room)}` : '', opts.showCohort ? escapeHtml(cohortLabel(s)) : ''].filter(Boolean).join(' • ')}</div>
              </div>`
            )
            .join('')
          return `<td style="border:1px solid #cbd5e1;padding:4px;vertical-align:top">${inner || '<span style="color:#cbd5e1">—</span>'}</td>`
        })
        .join('')
      return `<tr><th style="background:#f1f5f9;padding:8px;font-size:12px;border:1px solid #cbd5e1;text-align:left;white-space:nowrap">${escapeHtml(cap(day))}</th>${cells}</tr>`
    })
    .join('')

  return `<div style="font-family:Inter,Arial,sans-serif;background:#fff;padding:24px;color:#0f172a">
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:20px;font-weight:800">${escapeHtml(opts.title)}</div>
      ${opts.subtitle ? `<div style="font-size:13px;color:#475569;margin-top:4px">${escapeHtml(opts.subtitle)}</div>` : ''}
    </div>
    ${
      times.length === 0
        ? '<p style="text-align:center;color:#64748b">No classes scheduled.</p>'
        : `<table style="border-collapse:collapse;width:100%"><thead><tr><th style="background:#0f766e;color:#fff;padding:8px;font-size:12px;border:1px solid #0b5e58">Day / Time</th>${header}</tr></thead><tbody>${rows}</tbody></table>`
    }
    <div style="margin-top:10px;font-size:10px;color:#94a3b8;text-align:right">Generated ${escapeHtml(new Date().toLocaleString())} · Vriddhi</div>
  </div>`
}

async function renderCanvas(opts: TimetableExportOptions): Promise<HTMLCanvasElement> {
  const { html2canvas } = await loadPdfLibs()
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:1400px;background:#fff'
  host.innerHTML = buildHtml(opts)
  document.body.appendChild(host)
  try {
    return await html2canvas(host, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  } finally {
    host.remove()
  }
}

export async function downloadTimetableJPG(opts: TimetableExportOptions): Promise<void> {
  const canvas = await renderCanvas(opts)
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/jpeg', 0.92)
  a.download = `${opts.fileName}.jpg`
  a.click()
}

export async function downloadTimetablePDF(opts: TimetableExportOptions): Promise<void> {
  const canvas = await renderCanvas(opts)
  const { jsPDF } = await loadPdfLibs()
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 8
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height)
  const w = canvas.width * ratio
  const h = canvas.height * ratio
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (pageW - w) / 2, margin, w, h)
  pdf.save(`${opts.fileName}.pdf`)
}
