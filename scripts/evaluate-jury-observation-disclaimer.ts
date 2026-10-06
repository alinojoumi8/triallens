import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const base = join('tmp/qa/jury-contract-matrix-v9/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v9/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-3d74'))!)
const request = JSON.parse(await readFile(join(base, 'later-exclusion-3/later-exclusion-3-actor-1-input.json'), 'utf8'))
const result = JSON.parse(await readFile(join(base, 'later-exclusion-3/results.json'), 'utf8')).actors[0].result
const original = { ...result, grounding: undefined }
const corrected = { ...original, content: original.content.replace('from an expressly disclaimed observation', 'from a statement of unknown receipt') }
const isolated = (content: string) => ({ title: 'Source scope', content, citations: ['E-002'], verdict: null, jurors: [] })
const jobs: any[] = [
  { id: 'captured-observation-negative', request, draft: original, expected: 'failed', fresh: true },
  { id: 'corrected-uncertainty-positive', request, draft: corrected, expected: 'passed' },
  { id: 'noun-disclaimer-negative', request, draft: isolated('The account contains an explicit disclaimer of observation.'), expected: 'failed' },
  { id: 'denial-positive', request, draft: isolated('No disclaimed observation is recorded in E-002. It states receipt uncertainty.'), expected: 'passed' },
  { id: 'explicit-observation-positive', request: { ...request, evidence: request.evidence.map((e: any) => ({ ...e, text: e.text + ' I did not see a handover.' })) }, draft: isolated('The account expressly disclaims observation of the handover.'), expected: 'passed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-observation-disclaimer.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-observation-disclaimer', `live-${hash}-${Date.now()}`)
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
