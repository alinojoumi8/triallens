import 'dotenv/config'
import { readFile, mkdir } from 'node:fs/promises'
import { MiniMaxClient, createMiniMaxConfig, type StageRequest } from '../server/minimax'
import { supportedOpeningControl, supportedOpeningRequest } from '../samples/courtroom-realism/supported-opening'
import { DurablePilotTransport, assertApprovedPlan, durableJson, hashBytes } from './pilotEvidence'
import type { StageResult } from '../server/types'

// QA development-data challenge of the checker itself, separate from author
// generation. Never substitute these drafts for the original pilot's actors.
const directory = 'tmp/qa/courtroom/crown-opening'
const planPath = `${directory}/verifier-challenge-plan.json`
if (!process.argv.includes('--live')) {
  const pilot = JSON.parse(await readFile(`${directory}/prepared-plan.json`, 'utf8'))
  const cases = [
    { id: 'unsupported-participation', expected: 'failed', content: "The Crown's position, as a party submission and not yet as proof, is that the accused was involved in a disputed transfer described in the approved issue. That allegation is pleaded, not established." },
    { id: 'invented-elements', expected: 'failed', content: "What the Crown will have to prove on issue-1, at a minimum, is: (1) a transfer of the kind charged; (2) the accused's participation in that transfer; and (3) the requisite mental element." },
    { id: 'court-record-completeness', expected: 'failed', content: 'The only exhibit presently before the court is E-001, a notice.' },
    { id: 'unsupported-later-evidence', expected: 'failed', content: 'The Crown will meet its burden of proof beyond a reasonable doubt through evidence properly placed before you in due course, not through assumptions drawn from the silence of this packet.' },
  ].map(row => ({ ...row, request: pilot.request as StageRequest, draft: { title: '', content: row.content, citations: [], jurors: [] } as StageResult }))
  const plan = { authorization: 'User authorized this fictional verifier correction and fresh live evaluation without further spending approval.', dataClass: 'Development cases from captured pilot failures; not holdouts.', pilotPlanHash: hashBytes(await readFile(`${directory}/prepared-plan.json`, 'utf8')), provider: pilot.provider, settings: pilot.settings, budget: { maxCalls: 10, maxInputCharacters: 2000000, maxElapsedMs: 600000 }, candidateSourceHashes: [...pilot.candidateSourceHashes, { path: 'scripts/evaluate-opening-verifier.ts', sha256: hashBytes(await readFile('scripts/evaluate-opening-verifier.ts', 'utf8')) }, { path: 'samples/courtroom-realism/supported-opening.ts', sha256: hashBytes(await readFile('samples/courtroom-realism/supported-opening.ts', 'utf8')) }], cases: [...cases, { id: 'supported-disputed-account', expected: 'passed', content: supportedOpeningControl.content, request: supportedOpeningRequest, draft: supportedOpeningControl }], stopConditions: 'Execute each case once with at most one checker-format correction. Stop on transport/capture/aggregate failure. No tuning or repeat until green. Preserve all responses. No full hearing.' }
  await durableJson(planPath, plan)
  console.log(`Prepared checker challenge, zero calls: ${hashBytes(await readFile(planPath, 'utf8'))}`)
} else {
  const encoded = await readFile(planPath, 'utf8')
  const approvedHash = process.argv.find(arg => arg.startsWith('--approved-plan-hash='))?.split('=')[1]
  assertApprovedPlan(encoded, approvedHash)
  const plan = JSON.parse(encoded)
  for (const entry of plan.candidateSourceHashes) if (hashBytes(await readFile(entry.path, 'utf8')) !== entry.sha256) throw new Error(`Candidate drift: ${entry.path}`)
  process.env.MODEL_PROVIDER = 'minimax'
  process.env.MODEL_TEMPERATURE = String(plan.settings.temperature)
  process.env.MODEL_MAX_OUTPUT_TOKENS = String(plan.settings.maxOutputTokens)
  process.env.MINIMAX_REASONING_EFFORT = plan.settings.reasoningEffort
  const runDirectory = `${directory}/verifier-live-${approvedHash}-${Date.now()}`
  await mkdir(runDirectory, { recursive: true })
  await durableJson(`${runDirectory}/approved-plan.json`, plan)
  const transport = new DurablePilotTransport(runDirectory, { ...plan.budget, requestTimeoutMs: plan.provider.timeoutMs })
  const cancel = () => transport.cancel('Verifier challenge canceled by process signal.')
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel)
  const results = plan.cases.map((entry: { id: string; expected: string }) => ({ id: entry.id, expected: entry.expected, state: 'unexecuted' }))
  const save = () => durableJson(`${runDirectory}/results.json`, { label: 'Live checker development-data challenge; no author repair or legal certification.', planHash: approvedHash, results, usage: transport.usage(), qualifiedHumanReview: null })
  await save()
  try {
    for (const [index, entry] of plan.cases.entries()) {
      results[index].state = 'started'; await save()
      let call = 0
      const client = new MiniMaxClient({ ...createMiniMaxConfig(), ...plan.provider, provider: 'minimax' }, undefined, (input, init) => {
        transport.setContext({ caseId: entry.id, requestRole: 'checker', checkerRequest: ++call, approvedPlanHash: approvedHash })
        return transport.fetch(input, init)
      })
      try {
        const review = await client.reviewGrounding(entry.request, entry.draft)
        Object.assign(results[index], { state: 'finished', actual: review.status, matchesExpected: review.status === entry.expected, review })
        console.log(`${entry.id}: ${review.status}; expected ${entry.expected}`)
      } catch (error) {
        Object.assign(results[index], { state: 'failed', error: error instanceof Error ? error.message : String(error) })
        await save(); break
      }
      await save()
    }
  } finally { await save(); transport.dispose(); process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel) }
  console.log(`Evidence: ${runDirectory}`)
}
