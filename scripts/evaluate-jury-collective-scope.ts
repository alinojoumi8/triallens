import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const base = join('tmp/qa/jury-contract-matrix-v5/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v5/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-277818'))!)
async function captured(job: string, actor: number) {
  const request = JSON.parse(await readFile(join(base, job, `${job}-actor-${actor}-input.json`), 'utf8'))
  const result = JSON.parse(await readFile(join(base, job, 'results.json'), 'utf8')).actors[actor - 1].result
  return { request, draft: { ...result, grounding: undefined } }
}
const scope = await captured('conflicting-witnesses-3', 3), observation = await captured('hearing-Rowan', 6)
const fixedScope = structuredClone(scope.draft); fixedScope.jurors[0].rationale = fixedScope.jurors[0].rationale.replace('attribution-only material', 'assessment-permitted disputed accounts')
const fixedObservation = { ...observation.draft, content: 'My approved account in E-001 records that I saw Fictional Rowan hand the sealed envelope to Fictional Ellis and that I do not know what it contained. My approved account does not address further detail; I cannot add facts outside it.' }
const jobs = [
  { id: 'captured-collective-negative', ...scope, expected: 'failed' },
  { id: 'assessment-positive', request: scope.request, draft: fixedScope, expected: 'passed' },
  { id: 'counterfactual-positive', request: scope.request, draft: { ...fixedScope, content: 'If these sources were attribution-only material, that purpose would restrict their use. Here I assess the permitted disputed accounts.' }, expected: 'passed' },
  { id: 'captured-observation-negative', ...observation, expected: 'failed' },
  { id: 'account-boundary-positive', request: observation.request, draft: fixedObservation, expected: 'passed' },
  { id: 'recorded-extent-positive', request: observation.request, draft: { ...fixedObservation, content: fixedObservation.content + ' That is the full extent of the observations recorded in my approved account.' }, expected: 'passed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-collective-scope.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-collective-scope', `live-${hash}-${Date.now()}`)
await mkdir(run, { recursive: true }); await durableJson(join(run, 'plan.json'), plan)
await Promise.all(jobs.map(async job => {
  const directory = join(run, job.id); await mkdir(directory, { recursive: true })
  const transport = new DurablePilotTransport(directory, { maxCalls: 50, maxInputCharacters: 10000000, maxElapsedMs: 1800000, requestTimeoutMs: 240000 }); transport.setContext({ caseId: job.id, requestRole: 'checker', planHash: hash })
  const result: any = { id: job.id, state: 'started' }
  try {
    const client = new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: 'MiniMax-M3', timeoutMs: 240000, maxRetries: 3 }, undefined, transport.fetch)
    result.review = await client.reviewGrounding(job.request, job.draft); result.expectedMatched = result.review.status === job.expected; result.state = 'finished'; console.log(job.id + ': matched=' + result.expectedMatched)
  } catch (error) { result.state = 'failed'; result.error = String(error) }
  finally { result.usage = transport.usage(); await durableJson(join(directory, 'results.json'), result); transport.dispose() }
}))
console.log('Evidence: ' + run)
