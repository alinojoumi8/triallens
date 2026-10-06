import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const base = join('tmp/qa/jury-contract-matrix-v11/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v11/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-2808'))!)
const load = async (job: string) => {
  const request = JSON.parse(await readFile(join(base, job, `${job}-actor-2-input.json`), 'utf8'))
  const row = JSON.parse(await readFile(join(base, job, 'results.json'), 'utf8')).actors[1]
  const findings = row.grounding.findings
  const original = { title: findings.find((f: any) => f.unitId === 'title:1')?.text ?? '', content: findings.filter((f: any) => f.unitId.startsWith('content:')).map((f: any) => f.text).join(' '), citations: [...new Set(findings.flatMap((f: any) => f.citations.map((c: any) => c.exhibitId)))], jurors: [] }
  return { request, original, draftProvenance: 'Exact final failed title/content units reconstructed; top-level citation IDs recovered from verified finding citations. Original captured request preserved.' }
}
const acknowledgment = await load('conflicting-witnesses-1')
const agreement = await load('struck-testimony-2')
const isolated = (content: string) => ({ title: 'Public position', content, citations: [], jurors: [] })
const withoutOpponent = { ...agreement.request, courtroomEvents: agreement.request.courtroomEvents.filter((e: any) => e.type !== 'public_submission'), previousTurns: agreement.request.previousTurns.split('\n').filter((line: string) => !line.includes(' submission: ')).join('\n') }
const jobs: any[] = [
  { id: 'captured-acknowledgment-positive', ...acknowledgment, draft: acknowledgment.original, expected: 'passed', fresh: true },
  { id: 'captured-current-agreement-positive', ...agreement, draft: agreement.original, expected: 'passed', fresh: true },
  { id: 'acknowledgement-positive', request: acknowledgment.request, draft: isolated("The Defence accepts the Crown's acknowledgement on this supplied record."), expected: 'passed' },
  { id: 'prior-mutual-agreement-negative', request: agreement.request, draft: isolated('The Crown and Defence agreed on this point before this response.'), expected: 'failed' },
  { id: 'unavailable-opponent-negative', request: withoutOpponent, draft: isolated('The Crown and Defence agree on the core point.'), expected: 'failed' },
  { id: 'strengthened-opponent-negative', request: acknowledgment.request, draft: isolated("The Defence notes the Crown's acknowledgment that the receipt condition is established beyond a reasonable doubt."), expected: 'failed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-current-concurrence.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-current-concurrence', `live-${hash}-${Date.now()}`)
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
