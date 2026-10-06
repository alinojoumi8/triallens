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

const root = 'tmp/qa/courtroom/full-jury', planPath = `${root}/scenario-plan.json`
const scenarios: JuryScenarioId[] = ['conflicting-witnesses', 'later-exclusion', 'struck-testimony', 'missing-essential-proof']
if (!process.argv.includes('--live')) {
  const files = [...(await readdir('server', { recursive: true })).filter(p => p.endsWith('.ts')).map(p => join('server', p)), ...(await readdir('samples/courtroom-realism')).filter(p => p.endsWith('.ts')).map(p => join('samples/courtroom-realism', p)), 'scripts/evaluate-jury.ts', 'scripts/evaluate-jury-scenarios.ts', 'scripts/prepare-jury-scenarios.mjs', 'scripts/juryEvaluation.ts', 'scripts/hearingEvaluation.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].sort()
  const plan = { authorization: 'User requested steps 1-3 and unlimited fictional MiniMax testing, including jury decisions; no additional spend approval required.', runtime: process.version, scope: 'Two full live hearings through jury decision, then four prepared-record jury scenarios repeated three times. No actual-law validation, real-case data or deployment.',
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
  plan.controls = []; plan.jobs = plan.jobs.filter(job => job.scenario !== null)
  plan.scope = 'Twelve prepared-record jury scenarios, four families repeated three times, run alongside the separately frozen full hearing pair. Controls were 64/64 in candidate 995f1694; same production sources; no real-case data or legal certification.'
  await mkdir(root, { recursive: true }); await durableJson(planPath, plan)
  console.log(`Prepared 12 scenario trials; zero calls. Hash: ${hashBytes(await readFile(planPath, 'utf8'))}`)
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
  // Independent scenario jobs run alongside the separately frozen full hearing pair.
  await durableJson(`${run}/results.json`, { planHash, results })
  if (results.some(r => { const x = (r as { result: { error?: string; checks: Record<string, boolean> } }).result; return x.error || !Object.values(x.checks).every(Boolean) })) throw new Error(`Pilot failed; retained ${run}`)
  let next = 0
  let saveResults = Promise.resolve()
  await Promise.all([0, 1, 2, 3, 4, 5].map(async () => { while (next < plan.jobs.length) { const job = plan.jobs[next++]; results.push(await trial(job)); saveResults = saveResults.then(() => durableJson(`${run}/results.json`, { planHash, results })); await saveResults } }))
  console.log(`Evidence: ${run}`)
  if (results.some(r => { const x = (r as { result: { error?: string; checks: Record<string, boolean> } }).result; return x.error || !Object.values(x.checks).every(Boolean) })) process.exitCode = 1
}
