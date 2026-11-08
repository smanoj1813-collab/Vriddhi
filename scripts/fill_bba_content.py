#!/usr/bin/env python3
"""Fill stub topic records in bbaSeedData.ts with full content batches.

Each batch module (scripts/bba_content_p*.py) defines CONTENT as a dict:
  topic_id -> (explanationMd, formulas, tricks, howToSolve)
where formulas is a list of (label, formula, exampleQ, exampleA) tuples and
tricks is a list of (title, trick, whenToUse) tuples.

For every topic id present in bbaSeedData.ts the script replaces the record
tail (everything from ``explanationMd: ` `` through the record's closing
``},``) with freshly built fields. Idempotent: re-running with the same batch
yields identical bytes.
"""
import re
import sys
from pathlib import Path

FILE = Path('functions/src/data/bbaSeedData.ts')


def esc_ts(s: str) -> str:
    """Escape a single-quoted TypeScript string literal body."""
    return s.replace('\\', '\\\\').replace("'", "\\'")


def esc_tpl(s: str) -> str:
    """Validate a template-literal body (we forbid the dangerous sequences)."""
    assert '`' not in s, 'backtick in template literal content'
    assert '${' not in s, 'dollar-brace in template literal content'
    assert '\\' not in s, 'backslash in template literal content'
    return s


def how_steps(tid: str, how: str) -> list:
    """Split a 'Step 1: ... Step 2: ...' narrative into PrepHowToSolve objects."""
    parts = re.split(r'Step \d+:', how)
    chunks = [p.strip() for p in parts[1:] if p.strip()]
    if not chunks:
        chunks = [how.strip()]
    out = []
    for i, ch in enumerate(chunks, 1):
        first = ch.split('.')[0].strip()
        if len(first) > 72:
            first = first[:69].rstrip() + '...'
        out.append(('solve-%s-%d' % (tid, i), 'Step %d: %s' % (i, first), ch, 'Problem Solving / 5 to 10 Marks'))
    return out


def build_tail(tid: str, c: tuple) -> str:
    expl, formulas, tricks, how = c
    out = ['explanationMd: `' + esc_tpl(expl) + '`,']
    out.append('      formulas: [')
    for i, (label, formula, q, a) in enumerate(formulas, 1):
        out.append(
            "        { id: 'formula-%s-%d', label: '%s', formula: '%s', exampleQ: '%s', exampleA: '%s' },"
            % (tid, i, esc_ts(label), esc_ts(formula), esc_ts(q), esc_ts(a))
        )
    out.append('      ],')
    out.append('      tricks: [')
    for i, (title, trick, use) in enumerate(tricks, 1):
        out.append(
            "        { id: 'trick-%s-%d', title: '%s', trick: '%s', whenToUse: '%s' },"
            % (tid, i, esc_ts(title), esc_ts(trick), esc_ts(use))
        )
    out.append('      ],')
    out.append('      howToSolve: [')
    for sid, step, detail, qtype in how_steps(tid, how):
        out.append(
            "        { id: '%s', step: '%s', detail: '%s', questionType: '%s' },"
            % (esc_ts(sid), esc_ts(step), esc_ts(detail), esc_ts(qtype))
        )
    out.append('      ],')
    out.append('    },')
    return '\n      '.join(out[:-1]) + '\n' + out[-1]


def apply_batch(text: str, content: dict) -> tuple:
    applied, missing = 0, []
    for tid, c in content.items():
        id_pat = "id: '" + tid + "'"
        id_pos = text.find(id_pat)
        if id_pos < 0:
            missing.append(tid)
            continue
        m = re.search(r'^    \},?$', text[id_pos:], re.M)
        if not m:
            print('  WARNING: no record end for %s' % tid)
            missing.append(tid)
            continue
        rec_end = id_pos + m.start()
        tail_start = text.find('explanationMd: `', id_pos)
        if tail_start < 0 or tail_start > rec_end:
            print('  WARNING: no explanationMd for %s' % tid)
            missing.append(tid)
            continue
        old_tail = text[tail_start:rec_end + m.end() - m.start()]
        if 'howToSolve' not in old_tail:
            print('  WARNING: unexpected tail shape for %s' % tid)
            missing.append(tid)
            continue
        new_tail = build_tail(tid, c)
        text = text[:tail_start] + new_tail + text[rec_end + m.end() - m.start():]
        applied += 1
    return text, applied, missing


def main():
    if len(sys.argv) < 2:
        print('usage: fill_bba_content.py <batch_module> [...]')
        sys.exit(1)
    text = FILE.read_text()
    total = 0
    for mod_path in sys.argv[1:]:
        ns: dict = {}
        exec(compile(Path(mod_path).read_text(), mod_path, 'exec'), ns)
        content = ns['CONTENT']
        text, applied, missing = apply_batch(text, content)
        total += applied
        print('%s: applied %d/%d' % (mod_path, applied, len(content)))
        for tid in missing:
            print('  MISSING: %s' % tid)
    FILE.write_text(text)
    print('total applied: %d' % total)


if __name__ == '__main__':
    main()
