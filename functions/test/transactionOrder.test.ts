// functions/test/transactionOrder.test.ts
//
// A source-level guard for the one Firestore rule that types cannot check:
//
//     "Firestore transactions require all reads to be executed before all
//      writes."
//
// The Admin SDK raises that as a PLAIN Error, not an HttpsError, so it does not
// survive the callable boundary as something a human can read — the browser
// gets a bare "(INTERNAL)". Two live defects came from exactly this:
//
//   • completeClassSession read each ledger row it was about to write, after it
//     had already queued the session update. Every teacher saving the topics of
//     a class whose topics had planner rows saw
//     "The class session could not be completed. (INTERNAL)".
//   • cancelWeeklySchedule read the next session inside the loop that cancelled
//     the previous one, so cancelling a slot with more than one future class
//     failed the same way.
//
// Both are fixed, and the behavioural half of completeClassSession is pinned in
// classSchedule.test.ts against a fake transaction that enforces the rule. This
// file covers what a fake cannot: every OTHER transaction in the codebase,
// including ones whose only unit test is far away. It is deliberately a static
// scan — it needs no emulator, so it runs in the normal unit suite, and it fails
// with the file, line and the offending call.
//
// Run with: node --import tsx --test test/transactionOrder.test.ts

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')

const WRITE_METHODS = new Set(['set', 'update', 'delete', 'create'])
const READ_METHODS = new Set(['getAll', 'get'])

interface TransactionCallback {
  /** The transaction parameter's name, e.g. `txn` / `transaction`. */
  param: string
  body: string
  /** 1-based line of the callback's opening brace. */
  line: number
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'lib') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(full, acc)
    else if (entry.name.endsWith('.ts')) acc.push(full)
  }
  return acc
}

/** The text between a `{` and its matching `}`, ignoring nothing (good enough:
 *  these callbacks contain no unbalanced braces). */
function braceBlock(source: string, openIndex: number): { text: string; start: number } | null {
  let depth = 0
  for (let i = openIndex; i < source.length; i++) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return { text: source.slice(openIndex, i + 1), start: openIndex }
    }
  }
  return null
}

/** Every transaction callback in a source file, with its transaction parameter. */
export function transactionCallbacks(source: string): TransactionCallback[] {
  const out: TransactionCallback[] = []
  const marker = /runTransaction\s*(?:<[^>]*>\s*)?\(\s*(?:async\s*)?\(?\s*([A-Za-z_$][\w$]*)/g
  let match: RegExpExecArray | null
  while ((match = marker.exec(source))) {
    const brace = source.indexOf('{', match.index + match[0].length - 1)
    if (brace < 0) continue
    const block = braceBlock(source, brace)
    if (!block) continue
    out.push({
      param: match[1],
      body: block.text,
      line: source.slice(0, brace).split('\n').length,
    })
  }
  return out
}

/** Reads and writes issued through the transaction object, in source order. */
function transactionCalls(body: string, param: string): Array<{ kind: 'read' | 'write'; name: string }> {
  const pattern = new RegExp(`\\b${param}\\s*\\.\\s*(\\w+)\\s*\\(`, 'g')
  const calls: Array<{ kind: 'read' | 'write'; name: string }> = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body))) {
    const name = match[1]
    if (READ_METHODS.has(name)) calls.push({ kind: 'read', name })
    else if (WRITE_METHODS.has(name)) calls.push({ kind: 'write', name })
  }
  return calls
}

/**
 * Loop bodies that both read and write through the transaction. The source can
 * look correctly ordered while the runtime is not: iteration 2's read follows
 * iteration 1's write, and the SDK refuses it.
 */
function unsafeLoops(body: string, param: string): boolean {
  const loopStart = /\b(for|while)\s*\(/g
  let match: RegExpExecArray | null
  while ((match = loopStart.exec(body))) {
    const brace = body.indexOf('{', match.index + match[0].length - 1)
    if (brace < 0) continue
    const block = braceBlock(body, brace)
    if (!block) continue
    const kinds = new Set(transactionCalls(block.text, param).map((call) => call.kind))
    if (kinds.has('read') && kinds.has('write')) return true
  }
  return false
}

describe('transaction ordering', () => {
  const files = sourceFiles(SRC_DIR)

  it('finds the transactions it is meant to police', () => {
    // A guard that silently scans nothing is worse than no guard: if the
    // callback shape changes, this fails instead of passing vacuously.
    const total = files.reduce((sum, file) => sum + transactionCallbacks(fs.readFileSync(file, 'utf8')).length, 0)
    assert.ok(total >= 10, `expected the codebase's transactions to be discovered, found ${total}`)
  })

  it('never reads through the transaction after it has written', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const { param, body, line } of transactionCallbacks(source)) {
        let wrote = false
        for (const call of transactionCalls(body, param)) {
          if (call.kind === 'write') wrote = true
          else if (wrote) {
            offenders.push(`${path.relative(SRC_DIR, file)}:${line} ${param}.${call.name}() follows a write`)
            break
          }
        }
      }
    }
    assert.deepEqual(offenders, [], `reads after writes:\n${offenders.join('\n')}`)
  })

  it('never reads and writes through the transaction in one loop pass', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const { param, body, line } of transactionCallbacks(source)) {
        if (unsafeLoops(body, param)) {
          offenders.push(`${path.relative(SRC_DIR, file)}:${line} loop reads and writes via ${param}`)
        }
      }
    }
    assert.deepEqual(offenders, [], `loop-carried read-after-write:\n${offenders.join('\n')}`)
  })
})
