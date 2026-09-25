// Catalogue & accession register: titles, physical copies, ISBN look-up,
// barcode labels and CSV import/export (for colleges migrating from other
// library software).

import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { BookPlus, Download, FileUp, Loader2, Pencil, Plus, Printer, Search, Tag, Trash2, Wand2 } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, btn, downloadCsv, errMsg, fmtDate, inr } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import {
  COPY_STATUS_LABEL,
  TITLE_TYPES,
  addCopies,
  deleteTitle,
  importCatalogue,
  lookupIsbn,
  saveTitle,
  setCopyStatus,
  titleSearchText,
  type CatalogueImportRow,
  type CopyStatus,
  type LibraryCopy,
  type LibraryTitle,
  type TitleInput,
} from '../../api/libraryApi'
import { isValidIsbn, type LibrarySettings } from '../../utils/libraryEngine'
import { downloadLabelSheet } from '../../utils/labelsPdf'
import { todayIso } from '../../api/officeDb'
import { useLibraryCopies, useLibraryRefresh, useLibraryTitles } from '../../hooks/useLibrary'

const EMPTY_TITLE: TitleInput = {
  type: 'book', title: '', subtitle: '', authors: '', isbn: '', publisher: '', edition: '', year: '', pages: 0, language: 'English',
  category: '', subjects: '', callNumber: '', location: '', department: '', coverUrl: '', eUrl: '', price: 0,
}

const STATUS_TONE: Record<CopyStatus, 'green' | 'blue' | 'purple' | 'red' | 'amber' | 'slate'> = {
  available: 'green', issued: 'blue', on_hold: 'purple', lost: 'red', damaged: 'amber', withdrawn: 'slate', missing: 'red', binding: 'amber',
}

export default function CatalogueTab({ settings, collegeName }: { settings: LibrarySettings; collegeName: string }) {
  const { showSuccess, showError, showInfo } = useNotification()
  const titlesQ = useLibraryTitles()
  const copiesQ = useLibraryCopies()
  const refresh = useLibraryRefresh()

  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [editing, setEditing] = useState<{ id?: string; data: TitleInput } | null>(null)
  const [openTitle, setOpenTitle] = useState<LibraryTitle | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [labelOpen, setLabelOpen] = useState(false)
  const [page, setPage] = useState(1)

  const titles = titlesQ.data || []
  const copies = copiesQ.data || []
  const copiesByTitle = useMemo(() => {
    const m = new Map<string, LibraryCopy[]>()
    copies.forEach(c => m.set(c.titleId, [...(m.get(c.titleId) || []), c]))
    return m
  }, [copies])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    // an exact accession search jumps to its title
    const accHit = q ? copies.find(c => c.accessionNo.toLowerCase() === q) : undefined
    return titles.filter(t => {
      if (type !== 'all' && t.type !== type) return false
      if (category !== 'all' && t.category !== category) return false
      if (!q) return true
      if (accHit) return t.id === accHit.titleId
      return titleSearchText(t).includes(q)
    })
  }, [titles, copies, search, type, category])
  const PAGE = 50
  const shown = filtered.slice(0, page * PAGE)

  const categories = useMemo(() => Array.from(new Set([...settings.categories, ...titles.map(t => t.category).filter(Boolean)])).sort(), [settings.categories, titles])

  const exportRegister = () => {
    const titleById = new Map(titles.map(t => [t.id, t]))
    downloadCsv(`accession-register-${todayIso()}.csv`, copies.map(c => {
      const t = titleById.get(c.titleId)
      return {
        accessionNo: c.accessionNo, title: c.titleName, authors: t?.authors, isbn: t?.isbn, publisher: t?.publisher, edition: t?.edition, year: t?.year,
        category: t?.category, callNumber: c.callNumber, location: c.location, price: c.price, acquiredOn: c.acquiredOn, source: c.source,
        vendor: c.vendor, invoiceNo: c.invoiceNo, status: COPY_STATUS_LABEL[c.status],
      }
    }))
  }

  if (titlesQ.isLoading) return <Loading label="Loading catalogue…" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search title, author, ISBN, subject, call no. or accession no." className="input-field !pl-9" />
        </div>
        <select value={type} onChange={e => setType(e.target.value)} className="input-field !w-auto">
          <option value="all">All types</option>
          {TITLE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input-field !w-auto">
          <option value="all">All categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setEditing({ data: { ...EMPTY_TITLE, category: settings.categories[0] || '' } })} className={btn.primary}><BookPlus className="w-4 h-4" /> Add title</button>
        <button onClick={() => setLabelOpen(true)} className={btn.ghost}><Printer className="w-4 h-4" /> Labels</button>
        <button onClick={() => setImportOpen(true)} className={btn.ghost}><FileUp className="w-4 h-4" /> Import</button>
        <button onClick={exportRegister} disabled={!copies.length} className={btn.ghost}><Download className="w-4 h-4" /> Accession register</button>
      </div>

      <p className="text-xs text-vriddhi-muted">{filtered.length} titles · {copies.filter(c => !['lost', 'withdrawn'].includes(c.status)).length} volumes in stock · {copies.filter(c => c.status === 'issued').length} issued</p>

      {filtered.length === 0 ? (
        <Empty icon={<BookPlus className="w-6 h-6" />} title={titles.length ? 'No titles match' : 'Your catalogue is empty'} hint={titles.length ? 'Try a different search.' : 'Add titles one by one (scan the ISBN to auto-fill), or import your existing catalogue from a CSV/Excel export.'} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vriddhi-border">
                  <th className="table-header">Title</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Call no. / shelf</th>
                  <th className="table-header text-center">Copies</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(t => {
                  const physical = TITLE_TYPES.find(x => x.id === t.type)?.physical !== false
                  return (
                    <tr key={t.id} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-dark/20">
                      <td className="table-cell">
                        <button onClick={() => setOpenTitle(t)} className="text-left">
                          <p className="font-medium text-slate-900 dark:text-white hover:underline">{t.title}{t.edition ? <span className="text-vriddhi-muted font-normal"> · {t.edition} ed.</span> : null}</p>
                          <p className="text-xs text-vriddhi-muted">{[t.authors, t.publisher, t.year].filter(Boolean).join(' · ')}{t.isbn ? ` · ISBN ${t.isbn}` : ''}</p>
                        </button>
                      </td>
                      <td className="table-cell text-sm"><span className="text-vriddhi-text">{t.category || '—'}</span>{t.type !== 'book' && <span className="block text-[11px] text-vriddhi-muted">{TITLE_TYPES.find(x => x.id === t.type)?.label}</span>}</td>
                      <td className="table-cell text-sm font-mono">{t.callNumber || '—'}<span className="block text-[11px] font-sans text-vriddhi-muted">{t.location}</span></td>
                      <td className="table-cell text-center">
                        {physical ? (
                          <Badge tone={t.availableCopies > 0 ? 'green' : t.totalCopies > 0 ? 'amber' : 'slate'}>{t.availableCopies}/{t.totalCopies}</Badge>
                        ) : (
                          <Badge tone="blue">Online</Badge>
                        )}
                      </td>
                      <td className="table-cell text-right whitespace-nowrap">
                        <button onClick={() => setOpenTitle(t)} className={btn.small}><Tag className="w-3 h-3" /> Copies</button>{' '}
                        <button onClick={() => setEditing({ id: t.id, data: { ...t } })} className={btn.small}><Pencil className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {shown.length < filtered.length && (
            <div className="p-3 text-center"><button onClick={() => setPage(p => p + 1)} className={btn.ghost}>Show more ({filtered.length - shown.length})</button></div>
          )}
        </div>
      )}

      {editing && (
        <TitleEditor
          initial={editing.data}
          id={editing.id}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh() }}
          onDeleted={() => { setEditing(null); refresh() }}
        />
      )}
      {openTitle && (
        <CopiesModal
          title={titles.find(t => t.id === openTitle.id) || openTitle}
          copies={copiesByTitle.get(openTitle.id) || []}
          settings={settings}
          collegeName={collegeName}
          onClose={() => setOpenTitle(null)}
          onChanged={refresh}
        />
      )}
      {importOpen && (
        <ImportModal settings={settings} onClose={() => setImportOpen(false)} onDone={r => { setImportOpen(false); refresh(); showSuccess(`Imported ${r.titles} titles and ${r.copies} copies${r.skipped ? ` (${r.skipped} rows skipped)` : ''}.`) }} onError={e => showError(errMsg(e))} />
      )}
      {labelOpen && (
        <LabelModal copies={copies} settings={settings} collegeName={collegeName} onClose={() => setLabelOpen(false)} onInfo={showInfo} />
      )}
    </div>
  )
}

// ─── Title editor ────────────────────────────────────────
function TitleEditor({ initial, id, categories, onClose, onSaved, onDeleted }: { initial: TitleInput; id?: string; categories: string[]; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const { showSuccess, showError, showWarning } = useNotification()
  const [d, setD] = useState<TitleInput>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const set = <K extends keyof TitleInput>(k: K, v: TitleInput[K]) => setD(prev => ({ ...prev, [k]: v }))
  const physical = TITLE_TYPES.find(t => t.id === d.type)?.physical !== false

  async function lookup() {
    if (!isValidIsbn(d.isbn)) return showWarning('Enter a valid 10 or 13 digit ISBN.')
    setBusy('lookup')
    try {
      const r = await lookupIsbn(d.isbn)
      if (!r) return showWarning('No details found for this ISBN — please type them in.')
      setD(prev => ({
        ...prev,
        title: prev.title || r.title,
        subtitle: prev.subtitle || r.subtitle,
        authors: prev.authors || r.authors,
        publisher: prev.publisher || r.publisher,
        year: prev.year || r.year,
        pages: prev.pages || r.pages,
        subjects: prev.subjects || r.subjects,
        coverUrl: prev.coverUrl || r.coverUrl,
      }))
      showSuccess('Details filled from the ISBN.')
    } finally {
      setBusy(null)
    }
  }

  async function save() {
    setBusy('save')
    try {
      await saveTitle(d, id)
      showSuccess(id ? 'Title updated.' : 'Title added — now add its copies.')
      onSaved()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    if (!id || !window.confirm('Delete this title?')) return
    setBusy('delete')
    try {
      await deleteTitle(id)
      onDeleted()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={id ? 'Edit title' : 'Add title'}
      footer={
        <>
          {id && <button onClick={remove} disabled={!!busy} className={`${btn.danger} mr-auto`}><Trash2 className="w-4 h-4" /> Delete</button>}
          <button onClick={onClose} className={btn.ghost}>Cancel</button>
          <button onClick={save} disabled={!!busy || !d.title.trim()} className={btn.primary}>{busy === 'save' && <Loader2 className="w-4 h-4 animate-spin" />} Save</button>
        </>
      }
    >
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Type">
          <select className="input-field" value={d.type} onChange={e => set('type', e.target.value as TitleInput['type'])}>
            {TITLE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="ISBN / ISSN" className="sm:col-span-2">
          <div className="flex gap-2">
            <input className="input-field font-mono" value={d.isbn} onChange={e => set('isbn', e.target.value)} placeholder="Scan the barcode on the back cover" onKeyDown={e => e.key === 'Enter' && lookup()} />
            <button onClick={lookup} disabled={busy === 'lookup'} className={btn.ghost} title="Fetch details (Open Library / Google Books)">{busy === 'lookup' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Fetch</button>
          </div>
        </Field>
        <Field label="Title *" className="sm:col-span-2"><input className="input-field" value={d.title} onChange={e => set('title', e.target.value)} /></Field>
        <Field label="Subtitle"><input className="input-field" value={d.subtitle} onChange={e => set('subtitle', e.target.value)} /></Field>
        <Field label="Author(s)" className="sm:col-span-2"><input className="input-field" value={d.authors} onChange={e => set('authors', e.target.value)} /></Field>
        <Field label="Edition"><input className="input-field" value={d.edition} onChange={e => set('edition', e.target.value)} placeholder="e.g. 3rd" /></Field>
        <Field label="Publisher"><input className="input-field" value={d.publisher} onChange={e => set('publisher', e.target.value)} /></Field>
        <Field label="Year"><input className="input-field" value={d.year} onChange={e => set('year', e.target.value)} /></Field>
        <Field label="Language"><input className="input-field" value={d.language} onChange={e => set('language', e.target.value)} /></Field>
        <Field label="Category">
          <input className="input-field" list="lib-categories" value={d.category} onChange={e => set('category', e.target.value)} />
          <datalist id="lib-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Call number" hint="DDC / college scheme, e.g. 657.42 GUP"><input className="input-field font-mono" value={d.callNumber} onChange={e => set('callNumber', e.target.value)} /></Field>
        <Field label="Shelf / location"><input className="input-field" value={d.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Rack 4-B" /></Field>
        <Field label="Department"><input className="input-field" value={d.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Commerce" /></Field>
        <Field label="Subjects / keywords" className="sm:col-span-2"><input className="input-field" value={d.subjects} onChange={e => set('subjects', e.target.value)} /></Field>
        <Field label={physical ? 'Default price (₹)' : 'Subscription cost (₹)'}><input type="number" min={0} className="input-field" value={d.price || ''} onChange={e => set('price', Number(e.target.value) || 0)} /></Field>
        {!physical && <Field label="Access link" className="sm:col-span-3"><input className="input-field" value={d.eUrl} onChange={e => set('eUrl', e.target.value)} placeholder="https://…" /></Field>}
        {physical && <Field label="Pages"><input type="number" min={0} className="input-field" value={d.pages || ''} onChange={e => set('pages', Number(e.target.value) || 0)} /></Field>}
      </div>
    </Modal>
  )
}

// ─── Copies of one title ─────────────────────────────────
function CopiesModal({ title, copies, settings, collegeName, onClose, onChanged }: { title: LibraryTitle; copies: LibraryCopy[]; settings: LibrarySettings; collegeName: string; onClose: () => void; onChanged: () => void }) {
  const { showSuccess, showError } = useNotification()
  const [form, setForm] = useState({ count: 1, price: title.price, acquiredOn: todayIso(), source: 'purchase' as LibraryCopy['source'], vendor: '', invoiceNo: '', location: title.location, manual: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const physical = TITLE_TYPES.find(t => t.id === title.type)?.physical !== false

  async function add() {
    setBusy('add')
    try {
      const manual = form.manual.split(/[\s,]+/).filter(Boolean)
      const accs = await addCopies(title, { ...form, manualAccessions: manual.length ? manual : undefined }, settings)
      showSuccess(`Added ${accs.length} cop${accs.length === 1 ? 'y' : 'ies'}: ${accs[0]}${accs.length > 1 ? ` … ${accs[accs.length - 1]}` : ''}`)
      setForm(f => ({ ...f, manual: '' }))
      onChanged()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  async function changeStatus(c: LibraryCopy, s: CopyStatus) {
    setBusy(c.id)
    try {
      await setCopyStatus(c, s)
      onChanged()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  const printLabels = () =>
    downloadLabelSheet(
      copies.filter(c => !['lost', 'withdrawn'].includes(c.status)).map(c => ({ code: c.accessionNo, line1: c.titleName, line2: c.callNumber, line3: settings.libraryName })),
      { header: collegeName, filename: `labels-${title.title.slice(0, 30)}.pdf` },
    )

  return (
    <Modal open wide onClose={onClose} title={title.title}>
      <p className="text-sm text-vriddhi-muted mb-4">{[title.authors, title.publisher, title.year, title.isbn && `ISBN ${title.isbn}`].filter(Boolean).join(' · ')}</p>
      {!physical ? (
        <p className="text-sm text-vriddhi-muted">This is an online resource{title.eUrl ? <> — <a className="underline" href={title.eUrl} target="_blank" rel="noreferrer">open link</a></> : ''}. It has no physical copies.</p>
      ) : (
        <>
          <div className="rounded-xl border border-vriddhi-border p-3 mb-4">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Add copies (accession entry)</p>
            <div className="grid sm:grid-cols-4 gap-2">
              <Field label="How many"><input type="number" min={1} max={500} className="input-field" value={form.count} onChange={e => setForm({ ...form, count: Number(e.target.value) || 1 })} disabled={!!form.manual.trim()} /></Field>
              <Field label="Price each (₹)"><input type="number" min={0} className="input-field" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) || 0 })} /></Field>
              <Field label="Received on"><input type="date" className="input-field" value={form.acquiredOn} onChange={e => setForm({ ...form, acquiredOn: e.target.value })} /></Field>
              <Field label="Source">
                <select className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value as LibraryCopy['source'] })}>
                  <option value="purchase">Purchase</option><option value="donation">Donation / gift</option><option value="exchange">Exchange</option>
                </select>
              </Field>
              <Field label="Vendor"><input className="input-field" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} /></Field>
              <Field label="Invoice no."><input className="input-field" value={form.invoiceNo} onChange={e => setForm({ ...form, invoiceNo: e.target.value })} /></Field>
              <Field label="Location"><input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Field>
              <Field label="Existing accession nos." hint="Only when migrating old stock"><input className="input-field font-mono" value={form.manual} onChange={e => setForm({ ...form, manual: e.target.value })} placeholder="auto" /></Field>
            </div>
            <div className="mt-2 flex justify-end"><button onClick={add} disabled={busy === 'add'} className={btn.primary}>{busy === 'add' && <Loader2 className="w-4 h-4 animate-spin" />} Add &amp; number</button></div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{copies.length} cop{copies.length === 1 ? 'y' : 'ies'}</p>
            {copies.length > 0 && <button onClick={printLabels} className={btn.small}><Printer className="w-3 h-3" /> Print labels</button>}
          </div>
          {copies.length === 0 ? (
            <p className="text-sm text-vriddhi-muted">No copies yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Accession</th><th className="table-header">Status</th><th className="table-header">Received</th><th className="table-header text-right">Price</th><th className="table-header text-right">Change</th></tr></thead>
                <tbody>
                  {copies.map(c => (
                    <tr key={c.id} className="border-b border-vriddhi-border/50">
                      <td className="table-cell font-mono">{c.accessionNo}<span className="block text-[11px] font-sans text-vriddhi-muted">{c.location}</span></td>
                      <td className="table-cell"><Badge tone={STATUS_TONE[c.status]}>{COPY_STATUS_LABEL[c.status]}</Badge></td>
                      <td className="table-cell text-xs">{fmtDate(c.acquiredOn)}<span className="block text-vriddhi-muted">{c.source}{c.vendor ? ` · ${c.vendor}` : ''}</span></td>
                      <td className="table-cell text-right">{inr(c.price)}</td>
                      <td className="table-cell text-right">
                        {c.status === 'issued' ? (
                          <span className="text-xs text-vriddhi-muted">on loan</span>
                        ) : (
                          <select className="input-field !w-auto !py-1 !text-xs" value={c.status} disabled={busy === c.id} onChange={e => changeStatus(c, e.target.value as CopyStatus)}>
                            {(['available', 'binding', 'damaged', 'missing', 'lost', 'withdrawn'] as CopyStatus[]).concat(c.status === 'on_hold' ? ['on_hold'] : []).map(s => <option key={s} value={s}>{COPY_STATUS_LABEL[s]}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

// ─── CSV import ──────────────────────────────────────────
const IMPORT_COLUMNS = ['title', 'authors', 'isbn', 'publisher', 'edition', 'year', 'category', 'callNumber', 'location', 'price', 'accessionNo', 'type', 'department', 'subjects', 'acquiredOn']
const HEADER_ALIASES: Record<string, string> = {
  'title': 'title', 'book title': 'title', 'name': 'title', 'author': 'authors', 'authors': 'authors', 'isbn': 'isbn', 'publisher': 'publisher',
  'edition': 'edition', 'year': 'year', 'pub year': 'year', 'category': 'category', 'subject': 'subjects', 'subjects': 'subjects',
  'call no': 'callNumber', 'call number': 'callNumber', 'callnumber': 'callNumber', 'class no': 'callNumber', 'location': 'location', 'rack': 'location', 'shelf': 'location',
  'price': 'price', 'cost': 'price', 'accession': 'accessionNo', 'accession no': 'accessionNo', 'accessionno': 'accessionNo', 'acc no': 'accessionNo', 'barcode': 'accessionNo',
  'type': 'type', 'department': 'department', 'dept': 'department', 'date': 'acquiredOn', 'acquired on': 'acquiredOn', 'date of purchase': 'acquiredOn',
}

function ImportModal({ settings, onClose, onDone, onError }: { settings: LibrarySettings; onClose: () => void; onDone: (r: { titles: number; copies: number; skipped: number }) => void; onError: (e: unknown) => void }) {
  const [rows, setRows] = useState<CatalogueImportRow[]>([])
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function onFile(f: File) {
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => HEADER_ALIASES[h.trim().toLowerCase().replace(/[._]/g, ' ').replace(/\s+/g, ' ')] || h.trim(),
      complete: res => setRows(res.data.map(r => r as unknown as CatalogueImportRow).filter(r => r.title)),
      error: err => onError(err),
    })
  }

  async function run() {
    try {
      setProgress([0, rows.length])
      const r = await importCatalogue(rows, settings, (a, b) => setProgress([a, b]))
      onDone(r)
    } catch (e) {
      onError(e)
      setProgress(null)
    }
  }

  const template = () => downloadCsv('library-import-template.csv', [{ title: 'Financial Accounting', authors: 'S N Maheshwari', isbn: '9789352716854', publisher: 'Vikas', edition: '6th', year: '2018', category: 'Textbook', callNumber: '657 MAH', location: 'Rack 3-A', price: 650, accessionNo: 'ACC000001', type: 'book', department: 'Commerce', subjects: 'Accounting', acquiredOn: '2024-06-15' }], IMPORT_COLUMNS)

  return (
    <Modal
      open
      onClose={progress ? () => undefined : onClose}
      title="Import catalogue"
      footer={
        <>
          <button onClick={template} className={`${btn.ghost} mr-auto`}><Download className="w-4 h-4" /> Template</button>
          <button onClick={onClose} disabled={!!progress} className={btn.ghost}>Cancel</button>
          <button onClick={run} disabled={!rows.length || !!progress} className={btn.primary}>{progress && <Loader2 className="w-4 h-4 animate-spin" />} Import {rows.length || ''} rows</button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="text-vriddhi-muted">Upload a CSV (export from Excel / your old library software). One row per <b>copy</b>; rows with the same ISBN (or title + author) become one title. Common column names like “Acc No”, “Call No”, “Rack” are recognised. Leave accession numbers empty to auto-number.</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} className={btn.ghost}><FileUp className="w-4 h-4" /> Choose CSV file</button>
        {rows.length > 0 && <p className="text-vriddhi-text">{rows.length} rows ready · first: <b>{rows[0].title}</b>{rows[0].accessionNo ? ` (${rows[0].accessionNo})` : ''}</p>}
        {progress && (
          <div>
            <div className="h-2 rounded-full bg-vriddhi-border overflow-hidden"><div className="h-full bg-vriddhi-accent" style={{ width: `${(progress[0] / Math.max(1, progress[1])) * 100}%` }} /></div>
            <p className="text-xs text-vriddhi-muted mt-1">{progress[0]} / {progress[1]} — keep this window open</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Label printing ──────────────────────────────────────
function LabelModal({ copies, settings, collegeName, onClose, onInfo }: { copies: LibraryCopy[]; settings: LibrarySettings; collegeName: string; onClose: () => void; onInfo: (m: string) => void }) {
  const [mode, setMode] = useState<'date' | 'range'>('date')
  const [since, setSince] = useState(todayIso())
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [cols, setCols] = useState(3)
  const [rows, setRows] = useState(8)
  const [skip, setSkip] = useState(0)

  const selected = useMemo(() => {
    const live = copies.filter(c => !['lost', 'withdrawn'].includes(c.status))
    if (mode === 'date') return live.filter(c => (c.createdAt || c.acquiredOn).slice(0, 10) >= since)
    const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })
    return live.filter(c => (!from || cmp(c.accessionNo, from.toUpperCase()) >= 0) && (!to || cmp(c.accessionNo, to.toUpperCase()) <= 0))
  }, [copies, mode, since, from, to])

  const print = async () => {
    if (!selected.length) return onInfo('No copies match.')
    await downloadLabelSheet(selected.map(c => ({ code: c.accessionNo, line1: c.titleName, line2: c.callNumber, line3: settings.libraryName })), { header: collegeName, columns: cols, rows, skip, filename: `library-labels-${todayIso()}.pdf` })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Print barcode labels" footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={print} className={btn.primary}><Printer className="w-4 h-4" /> Download PDF ({selected.length})</button></>}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setMode('date')} className={mode === 'date' ? btn.primary : btn.ghost}>Added since</button>
          <button onClick={() => setMode('range')} className={mode === 'range' ? btn.primary : btn.ghost}>Accession range</button>
        </div>
        {mode === 'date' ? (
          <Field label="Copies added on or after"><input type="date" className="input-field" value={since} onChange={e => setSince(e.target.value)} /></Field>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Field label="From"><input className="input-field font-mono" value={from} onChange={e => setFrom(e.target.value)} placeholder={`${settings.accessionPrefix}000001`} /></Field>
            <Field label="To"><input className="input-field font-mono" value={to} onChange={e => setTo(e.target.value)} /></Field>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Field label="Columns"><input type="number" min={1} max={5} className="input-field" value={cols} onChange={e => setCols(Number(e.target.value) || 3)} /></Field>
          <Field label="Rows"><input type="number" min={1} max={14} className="input-field" value={rows} onChange={e => setRows(Number(e.target.value) || 8)} /></Field>
          <Field label="Skip labels" hint="partly used sheet"><input type="number" min={0} className="input-field" value={skip} onChange={e => setSkip(Number(e.target.value) || 0)} /></Field>
        </div>
        <p className="text-xs text-vriddhi-muted">A4 sheet, {cols}×{rows} = {cols * rows} labels per page. Code 39 barcodes work with any USB scanner and phone cameras.</p>
      </div>
    </Modal>
  )
}
