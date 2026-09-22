// ═══════════════════════════════════════════════════════════════════════
// examLockdown — clipboard + long-press lock for the exam surface.
//
// Why this exists: the test page used to prevent copy/paste with three
// bubble-phase `document` listeners that were switched on only when the
// faculty ticked "enable proctoring". Two problems followed:
//
//   1. Every unproctored test was wide open — a student could paste a whole
//      answer written elsewhere and the engine accepted it.
//   2. On a phone the `paste` event is not the only way text lands in a
//      field. Android keyboards (Gboard, Samsung) offer a clipboard chip in
//      the suggestion strip that commits text as an ordinary `insertText`,
//      and long-press selection handles can drop content in via a drag.
//      Neither is stopped by a `paste` listener, so blocking "worked" on a
//      laptop and leaked on the PWA.
//
// This module therefore listens on every path text can enter or leave an
// answer field, in the CAPTURE phase (before React's own handlers and before
// the browser commits the edit), and it is enforced for every test — not
// only proctored ones. Proctoring still decides whether the attempt is
// *reported* to the faculty; the block itself is unconditional, because an
// online exam where answers can be pasted in is not an exam.
//
// Deliberately NOT blocked: IME composition (`insertCompositionText`) and
// autocorrect (`insertReplacementText`). Vriddhi serves Kannada / Tamil /
// Telugu / Malayalam / Hindi medium students who transliterate through the
// system keyboard, and blocking composition would make those answers
// impossible to type. Bulk insertions that dodge the paste event are caught
// by `isSuspiciousBulkInsert` instead, which only rejects payloads no
// keyboard can produce in one keystroke.
// ═══════════════════════════════════════════════════════════════════════

export type ExamBlockReason =
  | 'paste_attempt'
  | 'copy_attempt'
  | 'cut_attempt'
  | 'context_menu'
  | 'drop_attempt'
  | 'bulk_input'
  | 'keyboard_shortcut'

export interface ExamLockdownOptions {
  /** Element that gets callout/selection suppression. Defaults to <body>. */
  root?: HTMLElement | null
  /** Long-press / right-click menu. Always blocked: it is the mobile Paste button. */
  blockContextMenu?: boolean
  /** Ctrl/Cmd shortcuts (copy, paste, cut, select-all, print, save, F12). */
  blockShortcuts?: boolean
  /** Called once per blocked action — wire it to the proctor-event logger. */
  onBlock?: (reason: ExamBlockReason, details?: Record<string, unknown>) => void
}

/** `beforeinput` types that move text in from outside the field. */
const PASTE_LIKE_INPUT_TYPES = new Set([
  'insertFromPaste',
  'insertFromPasteAsQuotation',
  'insertFromDrop',
  'insertFromYank',
])

/**
 * A single `insertText` this long is not typing — it is a clipboard chip, an
 * autofill, or a keyboard "paste as plain text" commit. Real typing fires one
 * `beforeinput` per character (or per IME segment, which is far shorter).
 * 24 characters is ~4 words of swipe text, which no mainstream keyboard emits
 * in one commit, so the false-positive risk is negligible.
 */
export const BULK_INSERT_CHAR_LIMIT = 24

/**
 * True when an `insertText` payload is too big to have been typed, or carries
 * a newline (multi-line clipboard content — a textarea can receive it, and
 * no touch keyboard emits a 5-line burst as one keystroke).
 */
export function isSuspiciousBulkInsert(inputType: string, data: string | null | undefined): boolean {
  if (inputType !== 'insertText' || !data) return false
  if (data.length >= BULK_INSERT_CHAR_LIMIT) return true
  return data.includes('\n') && data.trim().length >= 4
}

/** Whether this `beforeinput` should be cancelled outright. */
export function shouldBlockBeforeInput(inputType: string, data: string | null | undefined): boolean {
  return PASTE_LIKE_INPUT_TYPES.has(inputType) || isSuspiciousBulkInsert(inputType, data)
}

/**
 * Clipboard / devtools / print shortcuts, including the Shift variants
 * (Ctrl+Shift+V "paste as plain text" is the one students reach for when a
 * page blocks Ctrl+V) and the Mac Cmd equivalents.
 */
export function shouldBlockKeydown(event: {
  key?: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}): boolean {
  const key = (event.key || '').toLowerCase()
  const modifier = event.ctrlKey || event.metaKey
  if (modifier && ['c', 'v', 'x', 'a', 'p', 's', 'u', 'j'].includes(key)) return true
  if (modifier && event.shiftKey && ['c', 'v', 'x'].includes(key)) return true
  if (key === 'f12' || key === 'printscreen') return true
  if (event.altKey && (key === 'tab' || key === 'f4')) return true
  return false
}

/** Editable elements keep caret/selection so the student can still correct text. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'TEXTAREA') return true
  if (tag !== 'INPUT') return false
  const type = (target as HTMLInputElement).type
  // Only these input types accept free text, so only they can be pasted into.
  return ['text', 'search', 'url', 'tel', 'number', 'password', 'email'].includes(type)
}

/** Read-only clipboard probe used to confirm a block actually took effect. */
function clipboardHasText(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return Promise.resolve(false)
  return navigator.clipboard
    .readText()
    .then((text) => text.trim().length > 0)
    .catch(() => false)
}

/**
 * Installs the lockdown and returns its teardown. Call it from an effect that
 * lives exactly as long as the attempt (mount on "test active", clean up on
 * submit/unmount) so a finished student is not left with a frozen clipboard.
 */
export function applyExamLockdown(options: ExamLockdownOptions = {}): () => void {
  if (typeof document === 'undefined') return () => undefined

  const { root, blockContextMenu = true, blockShortcuts = true, onBlock } = options
  const target: HTMLElement | Document = root ?? document.body
  const cleanups: Array<() => void> = []

  const block = (reason: ExamBlockReason, event?: Event, details: Record<string, unknown> = {}) => {
    event?.preventDefault()
    event?.stopPropagation?.()
    try {
      onBlock?.(reason, details)
    } catch {
      // A reporting failure must never break the block itself.
    }
  }

  const onPaste = (event: Event) => {
    const inputEvent = event as ClipboardEvent
    const length = inputEvent.clipboardData?.getData('text/plain')?.length ?? 0
    block('paste_attempt', event, { chars: length })
  }

  const onCopy = (event: Event) => {
    // Copying the question out is as much a leak as pasting an answer in:
    // it is how a paper gets forwarded to a study group.
    block('copy_attempt', event, {
      chars: window.getSelection?.()?.toString().length ?? 0,
    })
  }

  const onCut = (event: Event) => block('cut_attempt', event)

  const onBeforeInput = (event: Event) => {
    const inputEvent = event as InputEvent
    if (!shouldBlockBeforeInput(inputEvent.inputType, inputEvent.data)) return
    const isPasteLike = PASTE_LIKE_INPUT_TYPES.has(inputEvent.inputType)
    block(isPasteLike ? 'paste_attempt' : 'bulk_input', event, {
      inputType: inputEvent.inputType,
      chars: inputEvent.data?.length ?? 0,
    })
  }

  const onContextMenu = (event: Event) => {
    if (!blockContextMenu) return
    // Allow the native menu inside an answer field only when it cannot paste:
    // it is the same menu, so it is blocked everywhere instead — the student
    // never needs it, and every partial allowance becomes the bypass.
    block('context_menu', event)
  }

  const onSelectStart = (event: Event) => {
    if (isEditableTarget(event.target)) return
    // No selection on the question → no "Copy" bubble on a phone.
    event.preventDefault()
  }

  const onDragStart = (event: Event) => event.preventDefault()

  const onDrop = (event: Event) => {
    const dragEvent = event as DragEvent
    const chars = dragEvent.dataTransfer?.getData('text/plain')?.length ?? 0
    block('drop_attempt', event, { chars })
  }

  const onKeyDown = (event: Event) => {
    if (!blockShortcuts) return
    const keyEvent = event as KeyboardEvent
    if (!shouldBlockKeydown(keyEvent)) return
    block('keyboard_shortcut', keyEvent, { key: keyEvent.key })
  }

  // Capture phase everywhere: React attaches its own listeners to the root
  // container, and the browser commits an edit before a bubble-phase handler
  // on document would ever run.
  const add = (name: string, handler: (event: Event) => void) => {
    document.addEventListener(name, handler, true)
    cleanups.push(() => document.removeEventListener(name, handler, true))
  }

  add('paste', onPaste)
  add('cut', onCut)
  add('copy', onCopy)
  add('beforeinput', onBeforeInput)
  if (blockContextMenu) add('contextmenu', onContextMenu)
  add('selectstart', onSelectStart)
  add('dragstart', onDragStart)
  add('drop', onDrop)
  add('dragover', onDragStart)
  if (blockShortcuts) add('keydown', onKeyDown)

  // Suppress the iOS/Android long-press callout on everything except the
  // answer fields themselves (which the handlers above already neuter).
  const style = document.createElement('style')
  style.dataset.vriddhiExamLockdown = 'true'
  style.textContent = `
    .exam-lockdown,
    .exam-lockdown * {
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
      -webkit-user-drag: none;
    }
    .exam-lockdown input,
    .exam-lockdown textarea,
    .exam-lockdown [contenteditable="true"] {
      -webkit-user-select: text;
      -moz-user-select: text;
      user-select: text;
      -webkit-touch-callout: default;
    }
    .exam-lockdown img { pointer-events: none; }
  `
  document.head.appendChild(style)
  const locked = target === document.body ? document.documentElement : target
  locked.classList.add('exam-lockdown')
  cleanups.push(() => {
    locked.classList.remove('exam-lockdown')
    style.remove()
  })

  // Belt and braces on phones: clear any clipboard text the student copied
  // before entering the test, where the browser lets us. Permission prompts
  // are declined silently — a rejected read is not a reason to bother a
  // student mid-exam.
  if (typeof navigator !== 'undefined' && 'clipboard' in navigator && navigator.clipboard?.writeText) {
    void clipboardHasText()
      .then((hasText) => (hasText ? navigator.clipboard.writeText('').catch(() => undefined) : undefined))
      .catch(() => undefined)
  }

  return () => {
    for (const cleanup of cleanups) cleanup()
    cleanups.length = 0
  }
}
