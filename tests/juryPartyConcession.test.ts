import { describe, expect, it } from 'vitest'
import { parseGroundingReview } from '../server/grounding'

const check = (text: string, actorRoles = ['defence'], citedRole = 'crown', eventId = 'closing') => parseGroundingReview(
  JSON.stringify({ findings: [{ unitId: 'content:1', status: 'supported', recordCitations: [{ eventId }] }] }),
  [{ id: 'content:1', text }], [], '', undefined,
  { packet: '', actorRoles, partyRoles: [{ id: 'crown', role: 'crown' }, { id: 'ellis', role: 'accused' }], events: [{ eventId: 'closing', type: 'public_submission', actorId: citedRole === 'crown' ? 'crown' : 'ellis', payload: { text: 'On this supplied record, the burden is not met; not guilty is the appropriate outcome.' } }] },
)

describe('present acceptance of a visible opposing-party concession', () => {
  it.each([
    "The Defence accepts the Crown's concession on this record.",
    "The Defence acknowledges the Crown's concession on the supplied record.",
    "The Defence notes the Crown's submission on the supplied record.",
  ])('uses the actual Crown record for %s', text => expect(check(text).status).toBe('passed'))
  it('preserves the symmetric Crown acceptance of a Defence submission', () => {
    expect(check("The Crown acknowledges the Defence's submission.", ['crown'], 'defence').status).toBe('passed')
  })
  it('rejects a concession attributed to the wrong cited party', () => {
    expect(check("The Defence accepts the Crown's concession.", ['defence'], 'defence').status).toBe('failed')
  })
  it('rejects an unavailable event', () => {
    expect(check("The Defence accepts the Crown's concession.", ['defence'], 'crown', 'unavailable').status).toBe('failed')
  })
  it('does not invent an earlier Defence acknowledgement from a Crown record', () => {
    expect(check("The Defence acknowledged the Crown's concession.").status).toBe('failed')
  })
})

describe('nominal acknowledgment and current concurrence', () => {
  it.each([
    "The defence notes the Crown's acknowledgment that attribution alone does not satisfy proof beyond a reasonable doubt.",
    "The Defence accepts the Crown's acknowledgement on this supplied record.",
    "The Fictional Crown and the Defence agree on the core point.",
  ])('accepts actual opponent record and own present position: %s', text => expect(check(text).status).toBe('passed'))
  it('accepts the Crown adopting the actual Defence position now', () => {
    expect(check('The Defence and the Crown agree on this point.', ['crown'], 'defence').status).toBe('passed')
  })
  it.each([
    "The defence notes the Crown's acknowledgment on this record.",
    'The Crown and Defence agree on the core point.',
  ])('rejects the wrong opponent record: %s', text => expect(check(text, ['defence'], 'defence').status).toBe('failed'))
  it('does not invent prior mutual agreement', () => expect(check('The Crown and Defence agreed on this point.').status).toBe('failed'))
  it('requires both party records for a third-party claim', () => expect(check('The Crown and Defence agree on this point.', ['judge']).status).toBe('failed'))
  it('requires the actual visible opposing event', () => expect(check('The Crown and Defence agree on this point.', ['defence'], 'crown', 'missing').status).toBe('failed'))
})
