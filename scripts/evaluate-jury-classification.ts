import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const baseline = join('tmp/qa/jury-contract-matrix-v3/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v3/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-c919'))!, 'conflicting-witnesses-1')
const request = JSON.parse(await readFile(join(baseline, 'conflicting-witnesses-1-actor-6-input.json'), 'utf8'))
const captured = JSON.parse(await readFile(join(baseline, 'results.json'), 'utf8')).actors[5].result
const make = (content: string, rationale: string) => ({ ...captured, grounding: undefined, content, jurors: captured.jurors.map((j: any) => ({ ...j, rationale })) })
const correct = 'The attributed disputed accounts in E-001 and E-002 leave reasonable doubt in my assessment of the receipt condition. Their primary-source classification is unknown, not established as non-primary.'
const jobs = [
  { id: 'captured-negative', draft: { ...captured, grounding: undefined }, expected: 'failed' },
  { id: 'aggregate-negative', draft: make('These are non-primary accounts.', correct), expected: 'failed' },
  { id: 'absence-negative', draft: make('There are no primary documents in the supplied record.', correct), expected: 'failed' },
  { id: 'classification-unknown-positive', draft: make(correct, correct), expected: 'passed' },
  { id: 'classified-absence-positive', draft: make('No source is classified as a primary document in the supplied record. I assess the attributed disputed accounts as insufficient to establish receipt beyond reasonable doubt.', correct), expected: 'passed' },
  { id: 'individual-assessment-positive', draft: make('Mira describes a handover in E-001; Tavi states no handover was seen and Rowan left with the token in E-002. I assess these disputed accounts as insufficient to establish receipt beyond reasonable doubt.', correct), expected: 'passed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-classification.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', request, jobs, sourceHashes }
const hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-classification', `live-${hash}-${Date.now()}`)
await mkdir(run, { recursive: true }); await durableJson(join(run, 'plan.json'), plan)
await Promise.all(jobs.map(async job => {
  const directory = join(run, job.id); await mkdir(directory, { recursive: true })
  const transport = new DurablePilotTransport(directory, { maxCalls: 50, maxInputCharacters: 10000000, maxElapsedMs: 1800000, requestTimeoutMs: 240000 })
  transport.setContext({ caseId: job.id, requestRole: 'checker', planHash: hash })
  const result: any = { id: job.id, state: 'started' }
  try {
    const client = new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: 'MiniMax-M3', timeoutMs: 240000, maxRetries: 3 }, undefined, transport.fetch)
    result.review = await client.reviewGrounding(request, job.draft); result.expectedMatched = result.review.status === job.expected; result.state = 'finished'
    console.log(job.id + ': matched=' + result.expectedMatched)
  } catch (error) { result.state = 'failed'; result.error = String(error) }
  finally { result.usage = transport.usage(); await durableJson(join(directory, 'results.json'), result); transport.dispose() }
}))
console.log('Evidence: ' + run)
