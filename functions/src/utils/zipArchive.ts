// functions/src/utils/zipArchive.ts
//
// Minimal, dependency-free ZIP reader for the question-paper import pipeline.
//
// The corpus arrives as a ZIP of PDFs (often nested one level, often zipped by
// Windows Explorer, occasionally holding a macOS resource fork). We only need to
//   * list the entries and their real sizes, and
//   * extract one entry's bytes at a time,
// so a full unzip library is unnecessary — and every new dependency in
// `functions/` costs cold start for ALL functions.
//
// Correctness notes that matter:
//   * Sizes and offsets are read from the CENTRAL DIRECTORY, never the local
//     header: entries written with a data descriptor (bit 3 — what most
//     streaming zip writers emit) carry zeroed sizes in the local header, and a
//     reader that trusts them silently returns empty files.
//   * ZIP64 entries are reported (`zip64: true`) instead of being mis-parsed:
//     the caller skips them with a clear message rather than importing garbage.
//   * Filenames honour the UTF-8 flag (bit 11); otherwise they are decoded as
//     latin1, which is what the CP437 bytes of those archives degenerate to for
//     the ASCII range that matters.
//
// Mirrored by scripts/prep-import-lib.mjs (the operator's local triage CLI).
// Both are unit-tested against the same documented behaviours
// (stored / deflated / data-descriptor / junk filtering / unsupported method).

import { inflateRawSync } from 'node:zlib'

const SIG_EOCD = 0x06054b50
const SIG_CENTRAL = 0x02014b50
const SIG_LOCAL = 0x04034b50
const SIG_ZIP64_EOCD = 0x06064b50

export interface ZipEntry {
  name: string
  /** 0 = stored, 8 = deflate. */
  method: number
  flags: number
  compSize: number
  size: number
  localOffset: number
  isDir: boolean
  /** True when this entry needs the ZIP64 structures we do not read. */
  zip64: boolean
}

function decodeName(buf: Buffer, flags: number): string {
  if (flags & 0x0800) return buf.toString('utf8')
  const utf8 = buf.toString('utf8')
  return utf8.includes('\uFFFD') ? buf.toString('latin1') : utf8
}

/** End-of-central-directory record: the LAST one in the file wins (comment-safe scan). */
function findEocd(buf: Buffer): number {
  const min = Math.max(0, buf.length - 66_000)
  for (let i = buf.length - 22; i >= min; i -= 1) {
    if (buf.readUInt32LE(i) === SIG_EOCD) {
      // A comment follows the 22-byte record; verify the length field agrees
      // before trusting this offset (a false positive inside a comment is rare
      // but a silent mis-parse is expensive).
      const commentLen = buf.readUInt16LE(i + 20)
      if (i + 22 + commentLen <= buf.length) return i
    }
  }
  return -1
}

export function readZipDirectory(buffer: Buffer): { entries: ZipEntry[]; zip64: boolean } {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  const eocd = findEocd(buf)
  if (eocd < 0) throw new Error('Not a ZIP archive (no end-of-central-directory record).')
  const total = buf.readUInt16LE(eocd + 10)
  const cdOffset = buf.readUInt32LE(eocd + 16)
  const zip64Marker = eocd >= 20 && buf.readUInt32LE(eocd - 20) === SIG_ZIP64_EOCD
  const entries: ZipEntry[] = []
  let p = cdOffset
  for (let i = 0; i < total; i += 1) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== SIG_CENTRAL) break
    const flags = buf.readUInt16LE(p + 8)
    const method = buf.readUInt16LE(p + 10)
    const compSize = buf.readUInt32LE(p + 20)
    const size = buf.readUInt32LE(p + 24)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOffset = buf.readUInt32LE(p + 42)
    const name = decodeName(buf.subarray(p + 46, p + 46 + nameLen), flags)
    entries.push({
      name,
      method,
      flags,
      compSize,
      size,
      localOffset,
      isDir: name.endsWith('/'),
      zip64: size === 0xffffffff || compSize === 0xffffffff || localOffset === 0xffffffff,
    })
    p += 46 + nameLen + extraLen + commentLen
  }
  return { entries, zip64: zip64Marker }
}

/** One entry's uncompressed bytes (stored or deflated). */
export function readZipEntry(buffer: Buffer, entry: ZipEntry): Buffer {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  if (entry.isDir) return Buffer.alloc(0)
  if (entry.zip64) throw new Error(`ZIP64 entries are not supported ("${entry.name}").`)
  if (entry.localOffset + 30 > buf.length || buf.readUInt32LE(entry.localOffset) !== SIG_LOCAL) {
    throw new Error(`Corrupt local header for "${entry.name}".`)
  }
  const nameLen = buf.readUInt16LE(entry.localOffset + 26)
  const extraLen = buf.readUInt16LE(entry.localOffset + 28)
  const start = entry.localOffset + 30 + nameLen + extraLen
  const raw = buf.subarray(start, start + entry.compSize)
  if (entry.method === 0) return Buffer.from(raw)
  if (entry.method === 8) return inflateRawSync(raw)
  throw new Error(`Unsupported ZIP compression method ${entry.method} for "${entry.name}".`)
}

/** Extensions the import pipeline can actually read. */
export const ZIP_CANDIDATE_EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'] as const

/**
 * Documents worth importing. Drops directories, macOS resource forks, Office
 * lock files and anything that is not a supported document — the operator sees
 * the skip count, not a wall of errors.
 */
export function selectZipDocuments(entries: ZipEntry[]): ZipEntry[] {
  return entries.filter((e) => {
    if (e.isDir) return false
    const name = e.name
    if (name.startsWith('__MACOSX/') || name.includes('/__MACOSX/')) return false
    if (/(^|\/)\._/.test(name)) return false
    if (/(^|\/)\.DS_Store$/i.test(name)) return false
    if (/~\$/.test(name)) return false
    const lower = name.toLowerCase()
    return ZIP_CANDIDATE_EXTENSIONS.some((ext) => lower.endsWith(ext))
  })
}

/**
 * Normalises an archive entry name for Storage: keeps the folder hint (so the
 * operator can tell two "question paper.pdf" apart) but strips characters that
 * would confuse a path, and caps the length.
 */
export function safeEntryName(rawName: string, index: number): string {
  const base = String(rawName || '').split(/[\\/]/).pop() || `document-${index}`
  const cleaned = base
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(-120)
  return cleaned || `document-${index}`
}
