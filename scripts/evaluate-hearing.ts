import 'dotenv/config'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig, type ModelClient, type StageRequest } from '../server/minimax'
import { hearingCheckerCases } from '../samples/courtroom-realism/hearing-checks'
import { runFictionalHearing } from './hearingEvaluation'
import { DurablePilotTransport, assertApprovedPlan, durableJson, hashBytes } from './pilotEvidence'

const root = 'tmp/qa/courtroom/scoped-hearing', planPath = `${root}/plan.json`
if (!process.argv.includes('--live')) {
  const files = [...(await readdir('server', { recursive: true })).filter(p => p.endsWith('.ts')).map(p => join('server', p)), 'scripts/evaluate-hearing.ts', 'scripts/hearingEvaluation.ts', 'scripts/pilotEvidence.ts', 'samples/courtroom-realism/hearing-fixture.ts', 'samples/courtroom-realism/hearing-checks.ts', 'samples/courtroom-realism/supported-opening.ts', 'package-lock.json'].sort()
  const plan = { authorization: 'User explicitly requested the fictional hearing evaluation and fixes, with MiniMax testing authorized without another spending approval.', scope: 'Crown and Defence openings, direct/cross/re-examination, a managed scope objection and live ruling, exact limiting instruction, database restart and closings. No jury ballots or decision, no actual law or real case.', runtime: process.version,
    settings: { model: 'MiniMax-M3', temperature: 0, reasoningEffort: 'medium', checkerReasoningEffort: 'high', maxOutputTokens: 16000, timeoutMs: 240000, maxRetries: 1 }, limits: { maxCalls: 260, maxInputCharacters: 20000000, maxElapsedMs: 5400000, requestTimeoutMs: 240000 }, variants: ['Rowan', 'Morgan'], cases: hearingCheckerCases(),
    candidateSourceHashes: await Promise.all(files.map(async path => ({ path, sha256: hashBytes(await readFile(path, 'utf8')) }))), successRule: 'Every predeclared negative control rejected for substantive reasons and every positive control accepted before hearings. Both hearings reach the closings checkpoint with all mechanical checks true; every final live author output independently faithful to the permitted sources and fictional instructions, useful for its role, with no private/scoped marker leak. First responses, repairs and counsel budget stops reported separately; no preferred verdict and no legal certification.',
    stopConditions: 'Run checker controls once. Do not start hearings if any checker decision mismatches or control is unexecuted. A failed live generation stops the paired attempt, never substitutes a scripted response; report remaining variants as unexecuted and fix before a fresh frozen pair. Prepared counsel finish controls may end an examination after a legitimate fixed-question-budget checkpoint, recorded separately. No tuning within this frozen candidate.' }
  await mkdir(root, { recursive: true }); await durableJson(planPath, plan)
  console.log(`Prepared ${plan.cases.length} checker controls and two scoped hearings; zero calls. Hash: ${hashBytes(await readFile(planPath, 'utf8'))}`)
} else {
  const encoded = await readFile(planPath, 'utf8'), planHash = process.argv.find(a => a.startsWith('--plan-hash='))?.split('=')[1]
  assertApprovedPlan(encoded, planHash); const plan = JSON.parse(encoded)
  if (process.version !== plan.runtime) throw new Error('Runtime changed.')
  for (const s of plan.candidateSourceHashes) if (hashBytes(await readFile(s.path, 'utf8')) !== s.sha256) throw new Error(`Candidate changed: ${s.path}`)
  Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: String(plan.settings.temperature), MODEL_MAX_OUTPUT_TOKENS: String(plan.settings.maxOutputTokens), MINIMAX_REASONING_EFFORT: plan.settings.reasoningEffort })
  const run = `${root}/live-${planHash}-${Date.now()}`; await mkdir(run, { recursive: true }); await durableJson(`${run}/approved-plan.json`, plan)
  const transport = new DurablePilotTransport(run, plan.limits), actors: unknown[] = [], checks: unknown[] = [], hearings: unknown[] = []
  let actorId = 0, currentCase = '', stop = false
  const save = () => durableJson(`${run}/results.json`, { planHash, checks, hearings, actors, usage: transport.usage(), unexecutedVariants: plan.variants.slice(hearings.length), independentAIReview: null, qualifiedHumanReview: null })
  const cancel = () => transport.cancel('Scoped hearing evaluation canceled.'); process.once('SIGINT', cancel); process.once('SIGTERM', cancel)
  const client = (id: string) => {
    let draftKind = 'original'
    return new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: plan.settings.model, timeoutMs: plan.settings.timeoutMs, maxRetries: plan.settings.maxRetries }, undefined, (input, init) => {
      const body = JSON.parse(String(init?.body)), user = body.messages[1].content as string, checker = user.startsWith('Stage: factual_verification')
      if (!checker) draftKind = user.includes('The independent source check rejected the previous draft.') ? 'repair' : 'original'
      transport.setContext({ caseId: currentCase, actorRequestId: id, requestRole: checker ? 'checker' : 'author', draftKind, checkerFormatCorrection: checker && user.includes('Verification-format correction needed:'), planHash })
      return transport.fetch(input, init)
    })
  }
  const model: ModelClient = { async generateStage(request: StageRequest) {
    const id = `${currentCase}-actor-${++actorId}`
    await durableJson(`${run}/${id}-input.json`, request)
    const row: Record<string, unknown> = { id, caseId: currentCase, stage: request.stage, state: 'started', inputHash: hashBytes(JSON.stringify(request)) }; actors.push(row); await save()
    try { const result = await client(id).generateStage(request); Object.assign(row, { state: 'finished', result, firstResponseAccepted: !result.grounding?.repairs }); await save(); console.log(`${id} ${request.stage}: accepted${result.grounding?.repairs ? ' after repair' : ''}`); return result }
    catch (e) { Object.assign(row, { state: 'failed', error: e instanceof Error ? e.message : String(e), grounding: (e as { grounding?: unknown }).grounding ?? null }); await save(); throw e }
  } }
  try {
    await save()
    for (const c of plan.cases) {
      currentCase = c.id
      try { const review = await client(c.id).reviewGrounding(c.request, c.draft); checks.push({ id: c.id, expected: c.expected, actual: review.status, matchesExpected: review.status === c.expected, review }); console.log(`${c.id}: ${review.status}`) }
      catch (e) { checks.push({ id: c.id, state: 'failed', error: String(e) }); stop = true }
      await save(); if (stop) break
    }
    if (!stop && checks.length === plan.cases.length && checks.every(c => (c as { matchesExpected?: boolean }).matchesExpected)) {
      for (const variant of plan.variants) {
        currentCase = `hearing-${variant}`
        const result = await runFictionalHearing({ variant, model, directory: `${run}/${currentCase}`, provider: { mode: 'external', name: 'minimax', model: plan.settings.model } })
        hearings.push(result); await save(); console.log(`${currentCase}: ${result.error ?? 'closings reached'}`)
        if (result.error) break
      }
    }
  } finally { await save(); transport.dispose(); process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel) }
  console.log(`Evidence: ${run}`)
  if (checks.length !== plan.cases.length || !checks.every(c => (c as { matchesExpected?: boolean }).matchesExpected) || hearings.length !== plan.variants.length || !hearings.every(h => !(h as { error?: string }).error && Object.values((h as { checks: Record<string, boolean> }).checks).every(Boolean))) process.exitCode = 1
}
