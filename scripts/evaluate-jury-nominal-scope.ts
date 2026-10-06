import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const base = join('tmp/qa/jury-contract-matrix-v10/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v10/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-e4ff'))!)
const load = async (job: string, actor: number) => {
  const request = JSON.parse(await readFile(join(base, job, `${job}-actor-${actor}-input.json`), 'utf8'))
  const result = JSON.parse(await readFile(join(base, job, 'results.json'), 'utf8')).actors[actor - 1].result
  return { request, original: { ...result, grounding: undefined } }
}
const knowledge = await load('struck-testimony-3', 3)
const classification = await load('conflicting-witnesses-3', 4)
const isolated = (content: string, exhibit = 'E-001') => ({ title: 'Source scope', content, citations: [exhibit], verdict: null, jurors: [] })
const jobs: any[] = [
  { id: 'captured-token-knowledge-negative', ...knowledge, draft: knowledge.original, expected: 'failed', fresh: true },
  { id: 'corrected-receipt-knowledge-positive', request: knowledge.request, draft: { ...knowledge.original, content: knowledge.original.content.replace('any token knowledge', 'knowledge of token receipt') }, expected: 'passed' },
  { id: 'captured-primary-proof-negative', ...classification, draft: classification.original, expected: 'failed', fresh: true },
  { id: 'corrected-classification-positive', request: classification.request, draft: { ...classification.original, content: classification.original.content.replace('with no primary corroboration', 'whose primary status remains unclassified'), jurors: classification.original.jurors.map((j: any) => ({ ...j, rationale: j.rationale.replace('not primary proof', 'with primary status unclassified') })) }, expected: 'passed' },
  { id: 'receipt-knowledge-noun-positive', request: knowledge.request, draft: isolated('Mira disclaims token receipt knowledge.'), expected: 'passed' },
  { id: 'knowledge-denial-positive', request: knowledge.request, draft: isolated('No disclaimer of all token knowledge is recorded; receipt uncertainty is recorded.'), expected: 'passed' },
  { id: 'explicit-token-knowledge-positive', request: { ...knowledge.request, evidence: knowledge.request.evidence.map((e: any) => ({ ...e, text: e.text + ' I have no token knowledge.' })) }, draft: isolated('Mira states she has no token knowledge.'), expected: 'passed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-nominal-scope.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-nominal-scope', `live-${hash}-${Date.now()}`)
await mkdir(run, { recursive: true }); await durableJson(join(run, 'plan.json'), plan)
await Promise.all(jobs.map(async job => {
  const directory = join(run, job.id); await mkdir(directory, { recursive: true })
  const transport = new DurablePilotTransport(directory, { maxCalls: 50, maxInputCharacters: 10000000, maxElapsedMs: 1800000, requestTimeoutMs: 240000 }); transport.setContext({ caseId: job.id, requestRole: 'checker', planHash: hash })
  const result: any = { id: job.id, state: 'started' }
  try {
    const client = new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: 'MiniMax-M3', timeoutMs: 240000, maxRetries: 3 }, undefined, (input, init) => { transport.setContext({ caseId: job.id, planHash: hash, requestRole: String(init?.body).includes('factual-source auditor') ? 'checker' : 'author' }); return transport.fetch(input, init) })
    result.review = await client.reviewGrounding(job.request, job.draft); result.expectedMatched = result.review.status === job.expected; if (job.fresh) result.generated = await client.generateStage(job.request); result.state = 'finished'; console.log(job.id + ': matched=' + result.expectedMatched)
  } catch (error) { result.state = 'failed'; result.error = String(error) }
  finally { result.usage = transport.usage(); await durableJson(join(directory, 'results.json'), result); transport.dispose() }
}))
console.log('Evidence: ' + run)
