import 'dotenv/config'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig, type ModelClient } from '../server/minimax'
import { runFictionalHearing } from './hearingEvaluation'
import { runJuryScenario } from './juryEvaluation'
import type { JuryScenarioId } from '../samples/courtroom-realism/jury-fixture'
import { DurablePilotTransport, durableJson, hashBytes, assertApprovedPlan } from './pilotEvidence'
import { contextHash } from '../server/actorMemory'
import { hearingCheckerCases } from '../samples/courtroom-realism/hearing-checks'

const root = 'tmp/qa/courtroom/full-jury', planPath = `${root}/plan.json`
const scenarios: JuryScenarioId[] = ['conflicting-witnesses', 'later-exclusion', 'struck-testimony', 'missing-essential-proof']
if (!process.argv.includes('--live')) {
  const files = [...(await readdir('server', { recursive: true })).filter(p => p.endsWith('.ts')).map(p => join('server', p)), ...(await readdir('samples/courtroom-realism')).filter(p => p.endsWith('.ts')).map(p => join('samples/courtroom-realism', p)), 'scripts/evaluate-jury.ts', 'scripts/juryEvaluation.ts', 'scripts/hearingEvaluation.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].sort()
  const plan = { authorization: 'User requested steps 1-3 and unlimited fictional MiniMax testing, including jury decisions; no additional spend approval required.', runtime: process.version, scope: 'Fresh patched candidate: two full live hearings through jury decision and four prepared-record jury scenarios repeated three times. Fourteen independent trials run concurrently; each jury remains serial. No actual-law validation, real-case data or deployment.',
    settings: { model: 'MiniMax-M3', temperature: 0, maxOutputTokens: 16000, timeoutMs: 240000, maxRetries: 3, reasoningEffort: 'medium', checkerReasoningEffort: 'high' },
    limits: { maxCalls: 5000, maxInputCharacters: 500000000, maxElapsedMs: 14400000, requestTimeoutMs: 240000 },
    controls: [...hearingCheckerCases(), ...[
      ['element-wording-negative', 'No participation is supplied in the record.', 'failed'],
      ['element-wording-positive', 'No knowing-participation element is supplied in the fictional packet; Mira nevertheless describes a handover.', 'passed'],
      ['participation-wording-negative', 'The supplied account does not identify contents, knowledge, or participation.', 'failed'],
      ['participation-wording-positive', 'The supplied account describes giver and recipient conduct; no knowing-participation element is supplied.', 'passed'],
      ['stale-return-negative', 'Before jury return, the limiting instruction remains required; the jury must remain out.', 'failed'],
      ['standing-limit-positive', 'The standing limited-use instruction permits attribution of Mira\'s account, not proof of contents or guilt.', 'passed'],
      ['non-observation-negative', 'I did not personally observe what was inside.', 'failed'],
      ['non-observation-positive', 'My approved account does not address further personal observations; I cannot add facts outside it.', 'passed'],
      ['observation-limit-negative', 'My personal observation is limited to the handover.', 'failed'],
      ['observation-limit-positive', 'My approved account records the handover and unknown contents; it does not record other observation details.', 'passed'],
      ['knowledge-timing-negative', "My approved account records what I knew regarding the contents at the time of the handover.", 'failed'],
      ['knowledge-timing-positive', 'My approved account does not address what I knew at the time of the handover; it states I do not know what the envelope contained.', 'passed'],
      ['contents-statement-negative', 'My approved account does not include any statement about the contents of the envelope.', 'failed'],
      ['contents-statement-positive', 'My approved account states unknown contents; it does not identify the actual contents.', 'passed'],
      ['exhaustive-summary-negative', 'My approved account does not go beyond identifying the giver and the recipient, so I cannot add further details.', 'failed'],
      ['exhaustive-summary-positive', 'My approved account records the sealed handover and my statement that I do not know what the envelope contained.', 'passed'],
      ['attribution-proof-negative', 'E-101 establishes that Mira saw the handover.', 'failed'],
      ['attribution-proof-positive', 'E-101 attributes Mira\'s account that she saw the handover, without establishing that it happened.', 'passed'],
      ['pleaded-elements-negative', 'No elements of participation, purpose, or transaction are pleaded before you.', 'failed'],
      ['pleaded-elements-positive', 'No knowing-participation element is supplied in the fictional packet; no pleading was supplied to this run.', 'passed'],
      ['burden-promise-negative', 'The Crown will meet that burden only with the approved evidence actually presented.', 'failed'],
      ['burden-promise-positive', 'The Crown bears the supplied burden. It will present the planned account within its attribution-only use limit.', 'passed'],
    ].map(([id, content, expected]) => ({ id, expected, request: { ...hearingCheckerCases()[1].request, stage: id.startsWith('non-observation') ? 'witness_answer' : id.startsWith('burden-promise') ? 'crown_opening' : 'defence_rebuttal', ...(id.startsWith('burden-promise') ? { courtroomActor: { id: 'crown', name: 'Fictional Crown', roles: ['crown'] }, approvedPartyRoles: [{ id: 'crown', name: 'Fictional Crown', role: 'crown' }, { id: 'ellis', name: 'Fictional Ellis', role: 'accused' }], packet: hearingCheckerCases()[1].request.packet + '\nApproved evidence plan: Fictional Mira will present her attributed account in E-101 within its attribution-only use limit.' } : {}), courtroomState: { juryPresent: true, examination: 'complete' } }, draft: { title: '', content, citations: [], jurors: [] } })), ...[
      ['vote-reason-negative', 'Juror 7 supplied a new admission by Ellis.', 'failed'],
      ['vote-reason-positive', 'My position remains stable; the supplied account does not establish contents or guilt.', 'passed'],
      ['vote-history-negative', 'No prior vote recorded; my position is stable.', 'failed'],
      ['vote-history-positive', 'My initial not-guilty position remains stable.', 'passed'],
    ].map(([id, reason, expected]) => ({ id, expected, request: { ...hearingCheckerCases()[1].request, stage: 'juror_ballot', courtroomAssessments: [{ issueId: 'issue-1', round: 'initial', choice: 'not_guilty', confidence: 60, rationale: 'The supplied account does not establish contents or guilt.', usable: true }] }, draft: { title: '', content: '', citations: [], jurors: [{ juror: 'Juror 1', rationale: 'The supplied account does not establish contents or guilt.', mindChangedBecause: reason }] } }))],
    jobs: [{ id: 'hearing-Rowan', variant: 'Rowan', scenario: null }, { id: 'hearing-Morgan', variant: 'Morgan', scenario: null }, ...scenarios.flatMap(scenario => [1, 2, 3].map(attempt => ({ id: `${scenario}-${attempt}`, scenario, variant: attempt === 2 ? 'Morgan' : 'Rowan', attempt })))],
    candidateSourceHashes: await Promise.all(files.map(async path => ({ path, sha256: hashBytes(await readFile(path, 'utf8')) }))),
    successRule: 'All mechanical checks true, exact actor inputs and native audit hashes consistent, source-faithful final responses independently reviewed. Preserve all first drafts, repairs and failed attempts. No preferred verdict; report pass@3 and pass^3 separately. No source edits during a candidate.' }
  const receiptSource = 'Tavi states: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.'
  const departureSource = 'Tavi states: Fictional Rowan left with the blue token still in hand. I did not see a handover.'
  const sourceCases = [
    ['receipt-uncertainty', receiptSource, "E-101 records Tavi's explicit non-observation of token receipt.", 'Tavi states uncertainty about token receipt.'],
    ['receipt-disclaimed-observation', receiptSource, "E-101 records Tavi's disclaimed observation of token receipt.", 'Tavi expressly states not knowing whether Ellis received any token.'],
    ['observation-nonoccurrence', departureSource, 'Tavi states no handover occurred.', 'Tavi states no handover was seen.'],
    ['observed-person', receiptSource, "E-101 records Tavi's attributed desk presence.", "E-101 records Ellis's observed presence at the desk."],
    ['continuous-observation', departureSource, 'E-101 records one specific moment, not continuous observation.', 'E-101 does not establish continuous observation.'],
    ['continuous-possession', departureSource, "The token never left Rowan's hand.", "Tavi states Rowan left with the token still in hand; this does not establish that the token never left the hand."],
    ['source-classification', receiptSource, 'E-101 is not a primary document.', 'No primary-document status for E-101 is supplied.'],
    ['aggregate-classification', receiptSource, 'On this non-primary record, the Crown has not met the burden.', 'No source is classified as a primary document in the supplied record.'],
    ['absent-primary-classification', receiptSource, 'With no primary source and no corroboration, the Crown cannot meet the burden.', 'Primary-source classification remains unknown; I assess the disputed account as insufficient on this record.'],
    ['exclusive-attribution-burden', hearingCheckerCases()[1].request.evidence[0].text, "Mira's attributed account meets the Crown's burden on receipt.", 'The attribution-only account does not meet the Crown burden on receipt.'],
  ]
  for (const [id, text, negative, positive] of sourceCases) for (const [suffix, content, expected] of [['negative', negative, 'failed'], ['positive', positive, 'passed']]) {
    const base = hearingCheckerCases()[1].request
    plan.controls.push({ id: `${id}-${suffix}`, expected, request: { ...base, stage: 'defence_rebuttal', courtroomActor: { id: 'ellis', name: 'Fictional Ellis', roles: ['defence'] }, courtroomEvents: [], packet: 'Approved scenario procedure: Assess only the supplied fictional receipt condition under the Crown beyond-a-reasonable-doubt burden. No actual law.', evidence: [{ ...base.evidence[0], text }], groundingContext: id === 'exclusive-attribution-burden' ? 'E-101: limited; permitted purposes: Accurately attribute the disputed account; not proof of contents or guilt.' : 'E-101: admitted; permitted purposes: Assess the fictional receipt condition using the disputed account. Unclassified; primary/documentary status is not supplied.' }, draft: { title: '', content, citations: [], jurors: [] } })
  }
  for (const [id, content, citedActor, expected] of [
    ['nominal-acknowledgment-positive', "The Defence notes the Crown's acknowledgment that its burden is not met.", 'crown', 'passed'],
    ['nominal-acknowledgement-positive', "The Defence accepts the Crown's acknowledgement on this record.", 'crown', 'passed'],
    ['present-shared-position-positive', 'The Crown and Defence agree that the burden is not met on this record.', 'crown', 'passed'],
    ['past-mutual-position-negative', 'The Crown and Defence agreed that the burden was not met before this response.', 'crown', 'failed'],
    ['wrong-party-shared-position-negative', 'The Crown and Defence agree that the burden is not met on this record.', 'ellis', 'failed'],
    ['visible-concession-positive', "The Defence accepts the Crown's concession on this record.", 'crown', 'passed'],
    ['visible-acknowledgement-positive', "The Defence acknowledges the Crown's concession on this record.", 'crown', 'passed'],
    ['wrong-party-concession-negative', "The Defence accepts the Crown's concession on this record.", 'ellis', 'failed'],
    ['invented-past-acknowledgement-negative', "The Defence acknowledged the Crown's concession on this record.", 'crown', 'failed'],
  ]) {
    const base = hearingCheckerCases()[1].request
    plan.controls.push({ id, expected, request: { ...base, stage: 'defence_rebuttal', courtroomActor: { id: 'ellis', name: 'Fictional Ellis', roles: ['defence'] }, approvedPartyRoles: [{ id: 'crown', name: 'Fictional Crown', role: 'crown' }, { id: 'ellis', name: 'Fictional Ellis', role: 'accused' }], courtroomEvents: [{ eventId: 'fixture-public-concession', type: 'public_submission', actorId: citedActor, payload: { text: 'On the supplied record, the Crown burden is not met; not guilty is the appropriate outcome.' } }], packet: 'Approved fictional procedure: Defence responds to the visible public submission; no earlier Defence acceptance is supplied.' }, draft: { title: '', content, citations: [], jurors: [] } })
  }
  for (const [id, content, expected] of [
    ['collective-purpose-negative', 'Receipt remains unproven beyond reasonable doubt on attribution-only material.', 'failed'],
    ['collective-purpose-positive', 'I assess the permitted disputed accounts as insufficient on this supplied record.', 'passed'],
  ]) {
    const base = hearingCheckerCases()[1].request
    plan.controls.push({ id, expected, request: { ...base, stage: 'defence_rebuttal', courtroomActor: { id: 'ellis', name: 'Fictional Ellis', roles: ['defence'] }, courtroomEvents: [], packet: 'Approved fictional procedure: assess the supplied receipt condition under the Crown beyond-reasonable-doubt burden. No actual law.', evidence: [base.evidence[0], { ...base.evidence[0], exhibitId: 'E-102', text: 'Tavi states: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.' }], groundingContext: ['E-101', 'E-102'].map(exhibit => `${exhibit}: admitted; permitted purposes: Assess the fictional condition using the attributed disputed account.`).join('\n') }, draft: { title: '', content, citations: [], jurors: [] } })
  }
  for (const [id, content, expected] of [
    ['personal-extent-negative', 'That is the full extent of my personal observation regarding the handover; my approved account does not address any further detail.', 'failed'],
    ['recorded-extent-positive', 'That is the full extent of the observations recorded in my approved account.', 'passed'],
  ]) plan.controls.push({ id, expected, request: { ...hearingCheckerCases()[1].request, stage: 'witness_answer' }, draft: { title: '', content, citations: [], jurors: [] } })
  for (const [id, content, expected] of [
    ['independent-proof-negation-positive', 'This attribution-only material cannot independently establish the receipt element.', 'passed'],
    ['independent-burden-negation-positive', 'The account does not independently satisfy the burden.', 'passed'],
    ['mixed-proof-but-negative', 'The account cannot independently prove contents but establishes the receipt element.', 'failed'],
    ['mixed-proof-and-negative', 'The account cannot independently prove contents and establishes the receipt element.', 'failed'],
  ]) {
    const base = plan.controls.find(c => c.id === 'exclusive-attribution-burden-positive')!
    plan.controls.push({ ...base, id, expected, draft: { title: '', content, citations: [], jurors: [] } })
  }
  for (const [id, content, sourceText, expected] of [
    ['token-knowledge-negative', 'Tavi explicitly disclaimed knowledge of any token.', 'Tavi states: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.', 'failed'],
    ['token-receipt-knowledge-positive', 'Tavi disclaims knowledge of any token receipt.', 'Tavi states: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.', 'passed'],
    ['token-knowledge-noun-negative', 'The account has an express disclaimer of any token knowledge.', 'Tavi states: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.', 'failed'],
    ['token-knowledge-noun-positive', 'Tavi disclaims token receipt knowledge.', 'Tavi states: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.', 'passed'],
    ['token-knowledge-noun-denial-positive', 'No disclaimer of all token knowledge is recorded; receipt uncertainty is recorded.', 'Tavi states: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.', 'passed'],
    ['token-knowledge-noun-support-positive', 'Tavi states he has no token knowledge.', 'Tavi states: I have no token knowledge.', 'passed'],
    ['token-explicit-knowledge-positive', 'Tavi states that he knows nothing about any token.', 'Tavi states: I know nothing about any token.', 'passed'],
  ]) {
    const base = plan.controls.find(c => c.id === 'aggregate-classification-positive')!
    plan.controls.push({ ...base, id, expected, request: { ...base.request, evidence: base.request.evidence.map(e => ({ ...e, name: 'fictional-tavi-token-knowledge.txt', text: sourceText })) }, draft: { title: '', content, citations: [], jurors: [] } })
  }
  for (const [id, content, explicitSupport, expected] of [
    ['observation-disclaimer-order-negative', 'Receipt cannot be inferred from an expressly disclaimed observation.', false, 'failed'],
    ['observation-disclaimer-denial-positive', 'No disclaimed observation is recorded in the supplied account; receipt remains unknown.', false, 'passed'],
    ['observation-disclaimer-support-positive', 'The account expressly disclaims observation of a handover.', true, 'passed'],
  ]) {
    const base = plan.controls.find(c => c.id === 'token-receipt-knowledge-positive')!
    plan.controls.push({ ...base, id, expected, request: { ...base.request, evidence: base.request.evidence.map(e => ({ ...e, text: e.text + (explicitSupport ? ' I did not see a handover.' : '') })) }, draft: { title: '', content, citations: [], jurors: [] } })
  }
  for (const [id, content, expected] of [
    ['not-primary-proof-negative', 'The supplied accounts are competing attributed accounts, not primary proof.', 'failed'],
    ['primary-corroboration-negative', 'As competing attributed accounts with no primary corroboration, the Crown has not established receipt.', 'failed'],
  ]) {
    const base = plan.controls.find(c => c.id === 'aggregate-classification-positive')!
    plan.controls.push({ ...base, id, expected, draft: { title: '', content, citations: [], jurors: [] } })
  }
  for (const [id, content, expected] of [
    ['juror-self-supplied-positive', 'As juror-11, I assess the supplied record on the listed condition.', 'passed'],
    ['juror-peer-supplied-negative', 'Juror-03 supplied the argument that receipt was proved.', 'failed'],
    ['juror-self-peer-claim-negative', 'As juror-11, I assess the supplied record; juror-03 said receipt was proved.', 'failed'],
  ]) {
    const base = plan.controls.find(c => c.id === 'aggregate-classification-positive')!
    plan.controls.push({ ...base, id, expected, request: { ...base.request, stage: 'juror_ballot', courtroomActor: { id: 'juror-11', name: 'Juror 11', roles: ['juror'] }, courtroomEvents: [], previousTurns: '' }, draft: { title: '', content, citations: [], jurors: [] } })
  }
  await mkdir(root, { recursive: true }); await durableJson(planPath, plan)
  console.log(`Prepared 14 trials; zero calls. Hash: ${hashBytes(await readFile(planPath, 'utf8'))}`)
} else {
  const encoded = await readFile(planPath, 'utf8'), planHash = process.argv.find(a => a.startsWith('--plan-hash='))?.split('=')[1]
  assertApprovedPlan(encoded, planHash); const plan = JSON.parse(encoded)
  if (process.version !== plan.runtime) throw new Error('Runtime changed.')
  for (const s of plan.candidateSourceHashes) if (hashBytes(await readFile(s.path, 'utf8')) !== s.sha256) throw new Error(`Candidate changed: ${s.path}`)
  Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
  const run = `${root}/live-${planHash}-${Date.now()}`; await mkdir(run, { recursive: true }); await durableJson(`${run}/approved-plan.json`, plan)
  const controls: unknown[] = []
  let nextControl = 0, saveControls = Promise.resolve()
  await Promise.all([0, 1, 2, 3].map(async () => { while (nextControl < plan.controls.length) {
    const c = plan.controls[nextControl++]
    const directory = `${run}/controls/${c.id}`; await mkdir(directory, { recursive: true })
    const transport = new DurablePilotTransport(directory, plan.limits)
    transport.setContext({ caseId: c.id, requestRole: 'checker', planHash })
    try {
      const client = new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: plan.settings.model, timeoutMs: plan.settings.timeoutMs, maxRetries: plan.settings.maxRetries }, undefined, transport.fetch)
      const transportRetries: string[] = []
      let review
      for (let attempt = 0; ; attempt++) {
        try { review = await client.reviewGrounding(c.request, c.draft); break }
        catch (error) {
          if (attempt >= plan.settings.maxRetries || !String(error).includes('request failed (529,')) throw error
          transportRetries.push(String(error))
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
        }
      }
      controls.push({ id: c.id, expected: c.expected, review, transportRetries, matchesExpected: review.status === c.expected, usage: transport.usage() })
      saveControls = saveControls.then(() => durableJson(`${run}/controls.json`, controls)); await saveControls; console.log(`${c.id}: ${review.status}`)
    } catch (e) {
      controls.push({ id: c.id, error: String(e), matchesExpected: false }); saveControls = saveControls.then(() => durableJson(`${run}/controls.json`, controls)); await saveControls
    } finally { transport.dispose() }
  } }))
  if (controls.length !== plan.controls.length || controls.some(c => !(c as { matchesExpected: boolean }).matchesExpected)) throw new Error(`Control mismatch; evidence retained: ${run}`)
  async function trial(job: { id: string; variant: string; scenario: JuryScenarioId | null }) {
    const directory = `${run}/${job.id}`; await mkdir(directory, { recursive: true })
    const transport = new DurablePilotTransport(directory, plan.limits), actors: Record<string, unknown>[] = []
    let index = 0, result: unknown
    const save = () => durableJson(`${directory}/results.json`, { job, actors, result, usage: transport.usage(), independentReview: null })
    const model: ModelClient = { async generateStage(request) {
      const id = `${job.id}-actor-${++index}`
      await durableJson(`${directory}/${id}-input.json`, request)
      const row: Record<string, unknown> = { id, stage: request.stage, state: 'started', inputHash: contextHash(request) }; actors.push(row); await save()
      let draftKind = 'original'
      const client = new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: plan.settings.model, timeoutMs: plan.settings.timeoutMs, maxRetries: plan.settings.maxRetries }, undefined, (input, init) => {
        const body = JSON.parse(String(init?.body)), user = body.messages[1].content as string, checker = user.startsWith('Stage: factual_verification')
        if (!checker) draftKind = user.includes('The independent source check rejected the previous draft.') || user.includes('Response JSON-format validation rejected the previous draft.') ? 'repair' : 'original'
        transport.setContext({ caseId: job.id, actorRequestId: id, requestRole: checker ? 'checker' : 'author', draftKind, checkerFormatCorrection: checker && user.includes('Verification-format correction needed:'), planHash })
        return transport.fetch(input, init)
      })
      try {
        const generated = await client.generateStage(request)
        if (['juror_ballot', 'jury_deliberation'].includes(request.stage) && (generated.jurors.length !== 1 || generated.jurors[0].juror !== request.jurorProfiles?.[0].juror)) throw new Error('Isolated juror response identity mismatch.')
        Object.assign(row, { state: 'finished', result: generated, firstResponseAccepted: !generated.grounding?.repairs }); await save()
        console.log(`${id}: ${request.stage}${generated.grounding?.repairs ? ' repaired' : ''}`); return generated
      } catch (e) { Object.assign(row, { state: 'failed', error: String(e), grounding: (e as { grounding?: unknown }).grounding ?? null }); await save(); throw e }
    } }
    try { result = job.scenario ? await runJuryScenario({ ...job, scenario: job.scenario, model, directory, provider: { mode: 'external', name: 'minimax', model: plan.settings.model } }) : await runFictionalHearing({ variant: job.variant, throughDecision: true, model, directory, provider: { mode: 'external', name: 'minimax', model: plan.settings.model } }) }
    finally { await save(); transport.dispose() }
    console.log(`${job.id} finished: ${JSON.stringify((result as { checks?: unknown }).checks)}`)
    return { id: job.id, result, usage: transport.usage() }
  }
  const results: unknown[] = []
  let next = 0
  let saveResults = Promise.resolve()
  await Promise.all(Array.from({ length: 14 }, async () => { while (next < plan.jobs.length) { const job = plan.jobs[next++]; results.push(await trial(job)); saveResults = saveResults.then(() => durableJson(`${run}/results.json`, { planHash, results })); await saveResults } }))
  console.log(`Evidence: ${run}`)
  if (results.some(r => { const x = (r as { result: { error?: string; checks: Record<string, boolean> } }).result; return x.error || !Object.values(x.checks).every(Boolean) })) process.exitCode = 1
}
