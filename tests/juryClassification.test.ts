import { describe, expect, it } from 'vitest'
import { parseGroundingReview } from '../server/grounding'
import type { EvidenceItem } from '../server/types'

const evidence = [{ exhibitId: 'E-001', text: 'Mira states: I saw Rowan hand a blue token to Ellis at the desk.' }] as EvidenceItem[]
const context = 'E-001: admitted; permitted purposes: Assess the fictional condition using the attributed disputed account.\nE-001: unclassified; unknown;'
const check = (text: string, approvedContext = context) => parseGroundingReview(
  JSON.stringify({ findings: [{ unitId: 'juror-0:1', status: 'analysis', citations: [{ exhibitId: 'E-001', paragraph: 1 }] }] }),
  [{ id: 'juror-0:1', text }], evidence, approvedContext,
)

describe('source classification versus missing classification', () => {
  it.each([
    'On this contradicted, non-primary record, the Crown has not met the burden.',
    'E-001 is a non-primary source.',
    'These are non-primary accounts.',
    'E-001 and E-002 are competing attributed accounts, not primary proof.',
    'As competing attributed accounts with no primary corroboration, the Crown has not established receipt.',
    'With no primary source and no corroboration, the Crown cannot meet beyond-reasonable-doubt on this condition.',
    'There are no primary documents in the supplied record.',
  ])('rejects invented classification even in an analysis unit: %s', text => {
    expect(check(text).status).toBe('failed')
  })
  it.each([
    'No source is classified as a primary document in the supplied record.',
    'Primary source status is unknown; this does not establish that the sources are non-primary.',
    'The disputed account does not convince me of receipt beyond reasonable doubt.',
    'No corroboration is supplied; I assess this disputed account as insufficient on this record.',
    'If these were non-primary sources, their classification would need to be established.',
  ])('preserves uncertainty and individual proof assessment: %s', text => {
    expect(check(text).status).toBe('passed')
  })
  it('preserves an expressly supplied non-primary classification', () => {
    expect(check('E-001 is a non-primary source.', 'E-001: admitted; non-primary summary; classification verified.').status).toBe('passed')
  })
})
