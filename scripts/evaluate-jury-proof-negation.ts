import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const morgan = JSON.parse(await readFile('tmp/qa/proof-negation-hearing-Morgan.json', 'utf8'))
const rowan = JSON.parse(await readFile('tmp/qa/proof-negation-hearing-Rowan.json', 'utf8'))
const isolated = (content: string) => ({ title: 'Proof-use assessment', content, citations: ['E-001'], verdict: null, jurors: [] })
const jobs = [
  { id: 'captured-morgan-positive', request: morgan.request, draft: morgan.draft, expected: 'passed' },
  { id: 'captured-rowan-unit-positive', request: rowan.request, draft: isolated(rowan.draft.jurors[0].rationale.split(/(?<=[.!?])\s+/)[0]), expected: 'passed' },
  { id: 'mixed-but-negative', request: morgan.request, draft: isolated('E-001 cannot independently prove contents but establishes the receipt element.'), expected: 'failed' },
  { id: 'mixed-and-negative', request: morgan.request, draft: isolated('E-001 cannot independently prove contents and establishes the receipt element.'), expected: 'failed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-proof-negation.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-proof-negation', `live-${hash}-${Date.now()}`)
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
