// functions/src/routes/schedules.ts
// ─── Server PDF for daily/weekly timetable exports ──────────────────────────
// Same Puppeteer contract as papers: 503 {fallback:'client'} when no Chrome,
// else 200 application/pdf.  Used by the admin/principal download buttons.

import express from 'express'
import { verifyAuth, requireRole } from '../middleware/auth'
import { sendRenderedPdf } from '../utils/pdfRenderer'

const router = express.Router()

const EXPORT_ROLES = ['superadmin','admin','principal','hod']

function esc(s: unknown): string {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function dayLabel(d: string): string {
  const map: Record<string,string> = {monday:'Monday',tuesday:'Tuesday',wednesday:'Wednesday',thursday:'Thursday',friday:'Friday',saturday:'Saturday',sunday:'Sunday'}
  return map[String(d||'').toLowerCase()] || String(d||'')
}

function toDisplayDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
  const d=new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
}

// POST /api/schedules/export/pdf
// Body: { mode:'daily'|'weekly', day?:string, schedules:any[], collegeName?:string, title?:string }
// When schedules are omitted the caller should have ensured a prior read; but for safety
// we also accept schedules in the body so the PDF can be rendered without an extra Firestore read.
// This keeps the route stateless and avoids needing a collegeId lookup in this stateless handler
// beyond auth.

router.post('/export/pdf', verifyAuth, requireRole(...EXPORT_ROLES), async (req: any, res) => {
  try {
    const body = req.body || {}
    const mode: 'daily'|'weekly' = body.mode === 'weekly' ? 'weekly' : 'daily'
    const day: string = String(body.day || 'monday')
    const schedules: any[] = Array.isArray(body.schedules) ? body.schedules : []
    const collegeName: string = String(body.collegeName || '')
    const title: string = String(body.title || (mode==='daily' ? `Daily Schedule — ${dayLabel(day)}` : 'Weekly Class Schedule'))

    if (schedules.length === 0) {
      res.status(400).json({ error: 'schedules is required (array of weeklySchedule rows)' })
      return
    }
    if (schedules.length > 800) {
      res.status(400).json({ error: 'Too many schedule rows (max 800)' })
      return
    }

    // Build printable HTML — inline styles so Puppeteer doesn't need external CSS
    const subtitle = body.subtitle ? esc(body.subtitle) : (mode==='weekly' ? esc(`Generated ${new Date().toLocaleString('en-IN')}`) : esc(`Generated ${new Date().toLocaleString('en-IN')}`))
    const collegeHtml = collegeName ? `<div style="font-size:10px;color:#475569;margin-top:4px">${esc(collegeName)}</div>` : ''

    let bodyHtml = ''

    if (mode === 'daily') {
      const filtered = schedules.filter((s:any)=> String(s.dayOfWeek||'').toLowerCase()===day.toLowerCase())
        .sort((a:any,b:any)=> String(a.startTime||'').localeCompare(String(b.startTime||'')))
      const rows = filtered.length ? filtered.map((s:any)=> `
        <tr>
          <td style="padding:7px 8px;border:1px solid #e2e8f0;font-size:10px;white-space:nowrap">${esc(s.startTime)}–${esc(s.endTime)}</td>
          <td style="padding:7px 8px;border:1px solid #e2e8f0"><div style="font-weight:600;font-size:11px">${esc(s.subject)}</div><div style="font-size:9px;color:#64748b">${esc(s.subjectCode||'')}</div></td>
          <td style="padding:7px 8px;border:1px solid #e2e8f0;font-size:10px">${esc(s.facultyName||s.facultyId)}</td>
          <td style="padding:7px 8px;border:1px solid #e2e8f0;font-size:10px">${esc([s.branch,s.batch,s.division].filter(Boolean).join(' • '))}</td>
          <td style="padding:7px 8px;border:1px solid #e2e8f0;font-size:10px">${esc(s.room||'—')}</td>
          <td style="padding:7px 8px;border:1px solid #e2e8f0;font-size:10px;text-transform:capitalize">${esc(s.type||'lecture')}</td>
        </tr>`).join('') : `<tr><td colspan="6" style="padding:28px;text-align:center;color:#64748b;font-style:italic">No classes scheduled for this day.</td></tr>`

      bodyHtml = `
        <table style="width:100%;border-collapse:collapse;margin-top:14px">
          <thead><tr style="background:#0f766e;color:#fff">
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;font-size:10px">Time</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;font-size:10px">Subject (Code)</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;font-size:10px">Faculty</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;font-size:10px">Branch / Batch</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;font-size:10px">Room</th>
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;font-size:10px">Type</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`
    } else {
      const DAYS=['monday','tuesday','wednesday','thursday','friday','saturday']
      const workingDays = DAYS.filter(d=> schedules.some((s:any)=> String(s.dayOfWeek||'').toLowerCase()===d))
      const days = workingDays.length ? workingDays : DAYS
      // unique slots globally (sorted)
      const slotKeys = Array.from(new Set(schedules.map((s:any)=> `${s.startTime}–${s.endTime}`))).sort()
      const cellMap = new Map<string, any>()
      schedules.forEach((s:any)=> {
        const key = `${String(s.dayOfWeek||'').toLowerCase()}|${s.startTime}–${s.endTime}`
        cellMap.set(key, s)
      })
      const headerCells = days.map(d=> `<th style="padding:8px;border:1px solid #0f766e;text-align:center;font-size:10px;min-width:90px">${esc(dayLabel(d).slice(0,3))}</th>`).join('')
      const rows = slotKeys.length ? slotKeys.map(key=> {
        const cells = days.map(d=>{
          const s = cellMap.get(`${d}|${key}`)
          if(!s) return `<td style="padding:7px 6px;border:1px solid #e2e8f0;text-align:center;color:#cbd5e1">—</td>`
          return `<td style="padding:7px 6px;border:1px solid #e2e8f0;vertical-align:top">
            <div style="font-weight:600;font-size:9px;line-height:1.2">${esc(s.subject)}</div>
            ${s.room?`<div style="font-size:8px;color:#0f766e">@${esc(s.room)}</div>`:''}
            <div style="font-size:8px;color:#475569">${esc(s.facultyName||'')}</div>
          </td>`
        }).join('')
        return `<tr><td style="padding:7px 8px;border:1px solid #e2e8f0;font-size:10px;white-space:nowrap;background:#f8fafc;font-weight:600">${esc(key)}</td>${cells}</tr>`
      }).join('') : `<tr><td colspan="${days.length+1}" style="padding:28px;text-align:center;color:#64748b">No classes scheduled this week.</td></tr>`

      bodyHtml = `
        <table style="width:100%;border-collapse:collapse;margin-top:14px;table-layout:fixed">
          <thead><tr style="background:#0f766e;color:#fff">
            <th style="padding:8px;border:1px solid #0f766e;text-align:left;font-size:10px;min-width:80px">Time</th>
            ${headerCells}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`
    }

    const html = `<!doctype html>
      <html><head><meta charset="utf-8" />
      <style>
        @page { size: ${mode==='weekly'?'landscape':'portrait'}; margin: 18mm 12mm 16mm 12mm; }
        * { box-sizing: border-box; }
        body { font-family: Inter, Helvetica, Arial, sans-serif; color:#0f172a; margin:0; padding:24px; }
        h1 { font-size:16px; margin:0; color:#0f766e; }
        .subtitle { font-size:9px; color:#64748b; margin-top:3px; }
        .footer { margin-top:18px; font-size:7px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:8px; }
      </style>
      </head><body>
        <h1>${esc(title)}</h1>
        ${collegeHtml}
        <div class="subtitle">${subtitle}</div>
        ${bodyHtml}
        <div class="footer">Vriddhi Academic Cloud — scalable, equal-distribution scheduling • ${esc(toDisplayDate())} </div>
      </body></html>`

    const filename = mode==='weekly' ? 'vriddhi-weekly-schedule.pdf' : `vriddhi-daily-${day}-schedule.pdf`

    await sendRenderedPdf(res, html, {
      filename,
      pdf: mode==='weekly'
        ? { format: 'A4', landscape: true, printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '10mm', right: '10mm' } }
        : { format: 'A4', landscape: false, printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '10mm', right: '10mm' } },
    })
  } catch (err:any){
    console.error('[schedules/export/pdf]', err)
    if(!res.headersSent) res.status(500).json({ error: err.message || 'Failed to render schedule PDF' })
  }
})

export { router as schedulesRouter }
export default router
