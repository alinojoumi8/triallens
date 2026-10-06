import { describe, expect, it } from 'vitest'
import { validateJuryBallotContract } from '../server/juryBallotContract'
import { MiniMaxClient } from '../server/minimax'
import { groundingUnits } from '../server/grounding'
import type { StageRequest } from '../server/minimax'
import type { StageResult } from '../server/types'
const request = { stage: 'juror_ballot', packet: '', evidence: [{ id: 'e1', exhibitId: 'E-001', text: 'Fictional source account.', label: 'Account', kind: 'statement' }, { id: 'e2', exhibitId: 'E-002', text: 'Other fictional account.', label: 'Other', kind: 'statement' }], previousTurns: '', courtroomProtocol: true, ballotRound: 'final', ballotContract: { initialChoice: 'guilty', permittedOutcomes: ['guilty', 'not_guilty', 'no_verdict'], instructionEventId: 'charge', events: [{ eventId: 'peer', exhibitIds: ['E-001'] }, { eventId: 'own', exhibitIds: ['E-001'] }] } } as unknown as StageRequest
function draft(citations: string[] = ['E-001'], event = 'peer'): StageResult { return { title: '', content: 'My vote is not guilty.', citations: ['E-002'], grounding: { status: 'passed', method: 'source-quotes-and-model-review', findings: [{ unitId: 'juror-0:1', text: '', status: 'supported', explanation: '', citations: [{ exhibitId: 'E-001', paragraph: 1, quote: 'verified source', startOffset: 0, endOffset: 15 }] }], errors: [], repairs: 0 }, jurors: [{ juror: 'Juror 7', leaning: 'defence', confidence: 60, rationale: 'Source-use limit.', citations, instructionEventId: 'charge', changedByEventId: event, mindChangedBecause: 'The actual turn clarified attribution-only purpose.' }] } }
describe('changed ballot event and source contract before commitment', () => {
 it('rejects a limiting instruction instead of an eligible deliberation event', () => expect(validateJuryBallotContract(request, draft(['E-001'], 'old-instruction'))).not.toEqual([]))
 it('propagates only verified same-juror citations and records the correction', () => {
  const result = draft([]); expect(validateJuryBallotContract(request, result)).toEqual([])
  expect(result.jurors![0].citations).toEqual(['E-001'])
  expect(result.grounding).toMatchObject({ jurorCitationCorrections: [{ jurorIndex: 0, exhibitId: 'E-001', unitIds: ['juror-0:1'] }] })
 })
 it('does not borrow top-level or another juror citations', () => {
  const result = draft([]); result.grounding!.findings[0].unitId = 'juror-1:1'
  expect(validateJuryBallotContract(request, result)).not.toEqual([])
  expect(result.jurors![0].citations).toEqual([])
 })
 it('rejects an unshared source even with a valid event', () => { const result = draft(['E-002']); result.grounding!.findings[0].citations[0].exhibitId = 'E-002'; expect(validateJuryBallotContract(request, result)).not.toEqual([]) })
 it('allows either an actual own or peer contribution with a shared source', () => {
  expect(validateJuryBallotContract(request, draft())).toEqual([])
  expect(validateJuryBallotContract(request, draft(['E-001'], 'own'))).toEqual([])
 })
 it('requires current charge acknowledgement and an explained change', () => {
  const result = draft(); result.jurors![0].instructionEventId='old'; expect(validateJuryBallotContract(request, result)).not.toEqual([])
  result.jurors![0].instructionEventId='charge'; result.jurors![0].mindChangedBecause=''; expect(validateJuryBallotContract(request, result)).not.toEqual([])
 })
 it('does not require a change event for an unchanged position', () => {
  const result=draft([]); result.jurors![0].leaning='crown'; result.jurors![0].changedByEventId=undefined
  expect(validateJuryBallotContract(request,result)).toEqual([])
 })
})

it('withholds a wrong-event draft and requests a bounded model correction', async () => {
 let authors=0; const bodies: string[]=[]
 const client=new MiniMaxClient({provider:'minimax',apiKey:'fictional',baseUrl:'https://fixture.invalid/v1',model:'fixture',timeoutMs:10000,maxRetries:1},undefined,async (_url,init) => {
  const body=String(init?.body); bodies.push(body)
  if (body.includes('factual-source auditor')) return Response.json({choices:[{message:{content:JSON.stringify({findings:groundingUnits(draft()).map(u=>({unitId:u.id,status:'analysis',citations:[]}))})}}]})
  authors++; return Response.json({choices:[{message:{content:JSON.stringify(draft(['E-001'],authors===1?'old-instruction':'peer'))}}]})
 })
 const result=await client.generateStage({...request,groundingRequired:true})
 expect(authors).toBe(2); expect(result.jurors![0].changedByEventId).toBe('peer')
 expect(result.grounding!.priorFailures!.some(f=>f.errors.some(e=>e.includes('eligible visible deliberation')))).toBe(true)
 expect(bodies.some(b=>b.includes('Ballot metadata validation rejected'))).toBe(true)
})
