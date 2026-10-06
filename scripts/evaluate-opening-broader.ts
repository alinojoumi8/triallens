import 'dotenv/config'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { openingEvaluationCases } from '../samples/courtroom-realism/opening-evaluation'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, assertApprovedPlan, durableJson, hashBytes } from './pilotEvidence'

const directory = 'tmp/qa/courtroom/crown-opening'
const planPath = `${directory}/broader-plan.json`
if (!process.argv.includes('--live')) {
  const original = JSON.parse(await readFile(`${directory}/prepared-plan.json`, 'utf8'))
  const sources = (await readdir('server', { recursive: true })).filter(p => p.endsWith('.ts')).map(p => join('server', p))
  const files = [...sources, 'scripts/evaluate-opening-broader.ts', 'scripts/pilotEvidence.ts', 'samples/courtroom-realism/opening-evaluation.ts', 'samples/courtroom-realism/supported-opening.ts', 'samples/courtroom-realism/fixture.ts', 'package-lock.json'].sort()
  const plan = { authorization: 'User explicitly requested the remaining correction and broader fictional MiniMax evaluation; no further spending approval required.', dataClass: 'Predeclared fictional development examples and paraphrases, not holdouts.', runtime: process.version, provider: original.provider, settings: original.settings, limits: { maxCalls: 84, maxInputCharacters: 3000000, maxElapsedMs: 1200000, requestTimeoutMs: 120000 }, candidateSourceHashes: await Promise.all(files.map(async path => ({ path, sha256: hashBytes(await readFile(path, 'utf8')) }))), cases: openingEvaluationCases(original.request), successRule: 'All 15 negative checker examples must be rejected, all 9 positive controls accepted; all 6 author outputs must be independently source-faithful and useful, with at least 4 passing first author response. Automated acceptance alone does not establish progression. No unresolved source-use, party-position or invented-procedure assertions. Human legal review remains separate.', stopConditions: 'Run every predeclared case once despite substantive rejection. Preserve checker-format corrections and up to one author repair under unchanged maxRetries1. Stop on aggregate deadline, cancellation, capture failure or transport failure, retaining remaining unexecuted cases. Do not tune within this frozen run or repeat until green. No automatic full hearing.' }
  await mkdir(directory, { recursive: true })
  await durableJson(planPath, plan)
  console.log(`Prepared 24 checker cases + 6 author cases; zero calls. Hash: ${hashBytes(await readFile(planPath, 'utf8'))}`)
} else {
  const encoded = await readFile(planPath, 'utf8')
  const hash = process.argv.find(arg => arg.startsWith('--approved-plan-hash='))?.split('=')[1]
  assertApprovedPlan(encoded, hash)
  const plan = JSON.parse(encoded)
  if (process.version !== plan.runtime) throw new Error('Runtime changed.')
  for (const item of plan.candidateSourceHashes) if (hashBytes(await readFile(item.path, 'utf8')) !== item.sha256) throw new Error(`Candidate changed: ${item.path}`)
  process.env.MODEL_PROVIDER = 'minimax'; process.env.MODEL_TEMPERATURE = String(plan.settings.temperature)
  process.env.MODEL_MAX_OUTPUT_TOKENS = String(plan.settings.maxOutputTokens); process.env.MINIMAX_REASONING_EFFORT = plan.settings.reasoningEffort
  const run = `${directory}/broader-live-${hash}-${Date.now()}`
  await mkdir(run, { recursive: true }); await durableJson(`${run}/approved-plan.json`, plan)
  const transport = new DurablePilotTransport(run, plan.limits)
  const cancel = () => transport.cancel('Broader evaluation canceled by process signal.')
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel)
  const results = plan.cases.map((c: { id: string; family: string; mode: string; expected: string }) => ({ id: c.id, family: c.family, mode: c.mode, expected: c.expected, state: 'unexecuted' }))
  const save = () => durableJson(`${run}/results.json`, { planHash: hash, label: 'Fictional development evaluation, no legal certification.', results, usage: transport.usage(), independentAIReview: null, qualifiedHumanReview: null })
  await save()
  try {
    for (const [index, entry] of plan.cases.entries()) {
      results[index].state = 'started'; await save()
      let generation = 0
      const client = new MiniMaxClient({ ...createMiniMaxConfig(), ...plan.provider, provider: 'minimax' }, undefined, (input, init) => {
        const body = JSON.parse(String(init?.body))
        const checker = body.messages[1].content.startsWith('Stage: factual_verification')
        if (!checker) generation++
        transport.setContext({ caseId: entry.id, mode: entry.mode, requestRole: checker ? 'checker' : 'author', generation, draftKind: generation > 1 ? 'repair' : 'original', approvedPlanHash: hash })
        return transport.fetch(input, init)
      })
      let stop = false
      try {
        if (entry.mode === 'checker') {
          const review = await client.reviewGrounding(entry.request, entry.draft)
          Object.assign(results[index], { state: 'finished', actual: review.status, matchesExpected: review.status === entry.expected, review })
        } else {
          const result = await client.generateStage(entry.request)
          Object.assign(results[index], { state: 'finished', actual: 'passed', result, firstResponseAccepted: !result.grounding?.repairs, successAfterRepair: Boolean(result.grounding?.repairs) })
        }
      } catch (error) {
        const audit = (error as { grounding?: unknown })?.grounding
        Object.assign(results[index], { state: audit ? 'withheld' : 'failed', error: error instanceof Error ? error.message : String(error), audit: audit ?? null })
        stop = !audit
      }
      await save()
      console.log(`${index + 1}/${plan.cases.length} ${entry.id}: ${results[index].actual ?? results[index].state}`)
      if (stop) break
    }
  } finally { await save(); transport.dispose(); process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel) }
  console.log(`Evidence: ${run}`)
}
