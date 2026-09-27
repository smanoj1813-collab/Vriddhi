// Generic CSV bulk-import modal for the office module (assets, consumables,
// circulation). Parses with papaparse, previews, then runs `processRow` for
// each row sequentially with progress and a per-row error report.

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { Download, FileUp, Loader2 } from 'lucide-react'
import { Modal, btn, downloadCsv, errMsg } from './officeUi'

export interface CsvBulkImportProps {
  title: string
  description: React.ReactNode
  templateName: string
  templateRows: Array<Record<string, unknown>>
  columns: string[]
  /** Header aliases, lower-cased keys → canonical column name. */
  aliases?: Record<string, string>
  /** Return false to skip a row silently (e.g. blank). Throw to report an error. */
  processRow: (row: Record<string, string>, index: number) => Promise<void | false>
  onClose: () => void
  onDone: (r: { ok: number; failed: number; skipped: number }) => void
}

export default function CsvBulkImport(p: CsvBulkImportProps) {
  const [rows, setRows] = useState<Array<Record<string, string>>>([])
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [finished, setFinished] = useState<{ ok: number; failed: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const norm = (h: string) => {
    const k = h.trim().toLowerCase().replace(/[._-]/g, ' ').replace(/\s+/g, ' ')
    if (p.aliases?.[k]) return p.aliases[k]
    const direct = p.columns.find(c => c.toLowerCase() === k.replace(/ /g, ''))
    return direct || h.trim()
  }

  function onFile(f: File) {
    setErrors([])
    setFinished(null)
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: norm,
      complete: res => setRows(res.data.filter(r => Object.values(r).some(v => String(v ?? '').trim()))),
      error: err => setErrors([err.message]),
    })
  }

  async function run() {
    const errs: string[] = []
    let ok = 0
    let skipped = 0
    setProgress([0, rows.length])
    for (let i = 0; i < rows.length; i++) {
      try {
        const r = await p.processRow(rows[i], i)
        if (r === false) skipped++
        else ok++
      } catch (e) {
        errs.push(`Row ${i + 2}: ${errMsg(e)}`)
      }
      setProgress([i + 1, rows.length])
    }
    setErrors(errs)
    setProgress(null)
    const result = { ok, failed: errs.length, skipped }
    setFinished(result)
    p.onDone(result)
  }

  return (
    <Modal
      open
      onClose={progress ? () => undefined : p.onClose}
      title={p.title}
      footer={
        <>
          <button onClick={() => downloadCsv(p.templateName, p.templateRows, p.columns)} className={`${btn.ghost} mr-auto`}><Download className="w-4 h-4" /> Template</button>
          <button onClick={p.onClose} disabled={!!progress} className={btn.ghost}>{finished ? 'Close' : 'Cancel'}</button>
          {!finished && (
            <button onClick={run} disabled={!rows.length || !!progress} className={btn.primary}>
              {progress && <Loader2 className="w-4 h-4 animate-spin" />} Import {rows.length || ''} rows
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="text-vriddhi-muted">{p.description}</div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={!!progress} className={btn.ghost}><FileUp className="w-4 h-4" /> Choose CSV file</button>
        <p className="text-xs text-vriddhi-muted">Columns: {p.columns.join(', ')}. Save your Excel sheet as “CSV (Comma delimited)”.</p>
        {rows.length > 0 && !finished && (
          <div className="overflow-x-auto border border-vriddhi-border rounded-xl">
            <table className="w-full text-xs">
              <thead><tr>{p.columns.map(c => <th key={c} className="text-left px-2 py-1 text-vriddhi-muted">{c}</th>)}</tr></thead>
              <tbody>{rows.slice(0, 5).map((r, i) => <tr key={i} className="border-t border-vriddhi-border/60">{p.columns.map(c => <td key={c} className="px-2 py-1 whitespace-nowrap">{r[c]}</td>)}</tr>)}</tbody>
            </table>
            {rows.length > 5 && <p className="text-xs text-vriddhi-muted px-2 py-1">…and {rows.length - 5} more rows</p>}
          </div>
        )}
        {progress && (
          <div>
            <div className="h-2 rounded-full bg-vriddhi-border overflow-hidden"><div className="h-full bg-vriddhi-accent" style={{ width: `${(progress[0] / Math.max(1, progress[1])) * 100}%` }} /></div>
            <p className="text-xs text-vriddhi-muted mt-1">{progress[0]} / {progress[1]} — keep this window open</p>
          </div>
        )}
        {finished && <p className="text-vriddhi-text font-medium">Done: {finished.ok} imported{finished.skipped ? `, ${finished.skipped} skipped` : ''}{finished.failed ? `, ${finished.failed} failed` : ''}.</p>}
        {errors.length > 0 && (
          <ul className="text-xs text-red-500 max-h-40 overflow-y-auto space-y-0.5">{errors.slice(0, 100).map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}
      </div>
    </Modal>
  )
}
