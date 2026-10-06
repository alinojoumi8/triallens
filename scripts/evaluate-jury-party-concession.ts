import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const base = join('tmp/qa/jury-contract-matrix-v4/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v4/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-af73'))!, 'struck-testimony-2')
const request = JSON.parse(await readFile(join(base, 'struck-testimony-2-actor-2-input.json'), 'utf8'))
const failed = JSON.parse(await readFile(join(base, 'results.json'), 'utf8')).actors[1].grounding
const draft = { title: 'Defence Rebuttal Closing', content: failed.findings.filter((f: any) => f.unitId.startsWith('content:')).map((f: any) => f.text).join(' '), citations: ['E-001'], jurors: [] }
const wrong = structuredClone(request); wrong.courtroomEvents = wrong.courtroomEvents.map((e: any) => e.type === 'public_submission' ? { ...e, actorId: 'accused-1' } : e)
const absent = structuredClone(request); absent.courtroomEvents = absent.courtroomEvents.filter((e: any) => e.type !== 'public_submission')
const jobs = [
  { id: 'captured-acceptance-positive', request, draft, expected: 'passed' },
  { id: 'acknowledgement-positive', request, draft: { ...draft, content: draft.content.replace('accepts', 'acknowledges') }, expected: 'passed' },
  { id: 'wrong-party-negative', request: wrong, draft, expected: 'failed' },
  { id: 'missing-submission-negative', request: absent, draft, expected: 'failed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-party-concession.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-party-concession', `live-${hash}-${Date.now()}`)
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
