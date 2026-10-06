import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const base = join('tmp/qa/jury-contract-matrix-v7/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v7/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-97fe'))!)
const request = JSON.parse(await readFile(join(base, 'later-exclusion-2/later-exclusion-2-actor-5-input.json'), 'utf8'))
const result = JSON.parse(await readFile(join(base, 'later-exclusion-2/results.json'), 'utf8')).actors[4].result
const original = { ...result, grounding: undefined }
const corrected = structuredClone(original)
corrected.content = corrected.content.replace('no knowledge of any token,', 'no knowledge of any token receipt,')
corrected.jurors[0].rationale = corrected.jurors[0].rationale.replace('knowledge of any token.', 'knowledge of any token receipt.')
const isolated = (content: string) => ({ title: 'Source scope', content, citations: ['E-002'], verdict: null, jurors: [] })
const jobs: any[] = [
  { id: 'captured-knowledge-negative', request, draft: original, expected: 'failed', fresh: true },
  { id: 'corrected-receipt-positive', request, draft: corrected, expected: 'passed' },
  { id: 'receipt-qualifier-positive', request, draft: isolated('Tavi disclaims knowledge of any token receipt.'), expected: 'passed' },
  { id: 'general-token-negative', request, draft: isolated('Tavi knows nothing about any token.'), expected: 'failed' },
  { id: 'explicit-broad-support-positive', request: { ...request, evidence: request.evidence.map((e: any) => ({ ...e, text: e.text + ' I know nothing about any token.' })) }, draft: isolated('Tavi states that he knows nothing about any token.'), expected: 'passed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-receipt-knowledge.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-receipt-knowledge', `live-${hash}-${Date.now()}`)
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
