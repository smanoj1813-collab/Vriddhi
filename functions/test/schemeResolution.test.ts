import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readCollegeScheme, type SchemeReader } from '../src/academic/schemeResolution'
import { normalizeSchemePack } from '../src/academic/schemeValidation'
import { academicFixture } from './helpers/academicFixture'

const customId = 'college-a__TEST_POLICY'
const reader = (
  college: Record<string, unknown> | undefined,
  custom?: Record<string, unknown>,
): SchemeReader => ({ college: async () => college, customPack: async () => custom })

describe('fail-closed college scheme resolution (shared by browser and server)', () => {
  it('refuses a missing college, missing binding and whitespace binding; no implicit BCU', async () => {
    for (const college of [undefined, {}, { schemePackId: null }, { schemePackId: '  ' }])
      await assert.rejects(
        readCollegeScheme('college-a', reader(college)),
        /College not found|configuration required/,
      )
    await assert.rejects(readCollegeScheme('', reader({})), /valid college/)
  })
  it('reports college read failures instead of selecting a university', async () => {
    await assert.rejects(
      readCollegeScheme('college-a', {
        college: async () => {
          throw new Error('permission-denied')
        },
        customPack: async () => undefined,
      }),
      /could not be read.*no default/,
    )
  })
  it('allows BCU and KUD ONLY when explicitly assigned', async () => {
    const bcu = await readCollegeScheme('college-a', reader({ schemePackId: 'BCU_SEP_2024' }))
    assert.equal(bcu.pack.code, 'BCU_SEP_2024')
    assert.equal(bcu.needsReconfirmation, true)
    const kud = await readCollegeScheme('college-a', reader({ schemePackId: 'KUD_NEP_CBAE' }))
    assert.equal(kud.pack.semesterEndExam.defaultMaxMarks, 60)
  })
  it('rejects dangling, unreadable, cross-tenant, ownerless, inactive and partial custom assignments', async () => {
    await assert.rejects(
      readCollegeScheme('college-a', reader({ schemePackId: customId })),
      /no longer exists/,
    )
    await assert.rejects(
      readCollegeScheme('college-a', {
        college: async () => ({ schemePackId: customId }),
        customPack: async () => {
          throw new Error('unavailable')
        },
      }),
      /could not be read/,
    )
    for (const pack of [
      { ...academicFixture(), collegeId: 'college-b' },
      academicFixture(),
      { ...academicFixture(), collegeId: 'college-a', status: 'draft' },
      { code: 'PARTIAL', collegeId: 'college-a' },
    ])
      await assert.rejects(readCollegeScheme('college-a', reader({ schemePackId: customId }, pack)))
    await assert.rejects(
      readCollegeScheme(
        'college-a',
        reader({ schemePackId: 'college-b__TEST_POLICY' }, { ...academicFixture(), collegeId: 'college-b' }),
      ),
      /not owned/,
    )
  })
  it('normalizes complete explicitly bound legacy customs but requests revision confirmation', async () => {
    const result = await readCollegeScheme(
      'college-a',
      reader({ schemePackId: customId }, { ...academicFixture(), collegeId: 'college-a' }),
    )
    assert.equal(result.pack.courses![0].credits, 4)
    assert.equal(result.needsReconfirmation, true)
  })
  it('uses the explicitly activated snapshot even if a saved source revision has changed', async () => {
    const pinned = normalizeSchemePack(academicFixture())
    let sourceReads = 0
    const result = await readCollegeScheme('college-a', {
      college: async () => ({ schemePackId: customId, schemePackRevision: 1, schemePackSnapshot: pinned }),
      customPack: async () => {
        sourceReads++
        return { ...academicFixture(), revision: 2 }
      },
    })
    assert.equal(result.revision, 1)
    assert.equal(result.needsReconfirmation, false)
    assert.equal(sourceReads, 0)
  })
  it('refuses malformed/mismatched snapshots, never hiding them with a preset fallback', async () => {
    for (const snapshot of [
      { code: 'PARTIAL' },
      { ...academicFixture(), id: 'different' },
      { ...academicFixture(), status: 'archived' },
      { ...academicFixture(), revision: 2 },
    ])
      await assert.rejects(
        readCollegeScheme(
          'college-a',
          reader({ schemePackId: customId, schemePackRevision: 1, schemePackSnapshot: snapshot }),
        ),
      )
    await assert.rejects(
      readCollegeScheme(
        'college-a',
        reader({ schemePackId: 'BCU_SEP_2024', schemePackRevision: 1, schemePackSnapshot: {} }),
      ),
    )
  })
})
