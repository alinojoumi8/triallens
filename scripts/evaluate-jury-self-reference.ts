import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'

Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const base = join('tmp/qa/jury-contract-matrix-v11/tmp/qa/courtroom/full-jury', (await readdir('tmp/qa/jury-contract-matrix-v11/tmp/qa/courtroom/full-jury')).find(n => n.startsWith('live-2808'))!)
const job = 'conflicting-witnesses-2'
const request = JSON.parse(await readFile(join(base, job, `${job}-actor-13-input.json`), 'utf8'))
const findings = JSON.parse(await readFile(join(base, job, 'results.json'), 'utf8')).actors[12].grounding.findings
const texts = (prefix: string) => findings.filter((f: any) => f.unitId.startsWith(prefix)).map((f: any) => f.text).join(' ')
const citations = [...new Set(findings.flatMap((f: any) => f.citations.map((c: any) => c.exhibitId)))]
const original = { title: texts('title:'), content: texts('content:'), citations, jurors: [{ juror: 'juror-11', rationale: texts('juror-0:'), mindChangedBecause: texts('juror-change-0:'), citations }] }
const isolated = (content: string) => ({ title: 'Juror review', content, citations: [], jurors: [] })
const peerText = "Mira describes a handover in E-001."
const peerEvent = { eventId: 'fictional-peer-control', type: 'juror_deliberation_turn', actorId: 'juror-03', payload: { contribution: peerText } }
const jobs: any[] = [
  { id: 'captured-self-supplied-positive', request, draft: original, expected: 'passed', fresh: true, draftProvenance: 'Exact failed title/content/rationale/change units reconstructed from captured findings; citations recovered from verified findings. No claim of unchanged original StageResult metadata. Original actor request preserved.' },
  { id: 'self-supplied-record-positive', request, draft: isolated('As juror-11, I assess the supplied record on the listed condition.'), expected: 'passed' },
  { id: 'unavailable-peer-supplied-negative', request, draft: isolated('Juror-03 supplied the argument that Mira describes a handover in E-001.'), expected: 'failed' },
  { id: 'visible-peer-supplied-positive', request: { ...request, courtroomEvents: [...request.courtroomEvents, peerEvent], previousTurns: request.previousTurns + '\nJuror-03 deliberation: ' + peerText }, draft: isolated('Juror-03 supplied the argument that Mira describes a handover in E-001.'), expected: 'passed', fixtureProvenance: 'Explicit fictional peer contribution appended for positive historical-attribution control.' },
  { id: 'self-introduction-peer-negative', request, draft: isolated('As juror-11, I assess the supplied record; juror-03 said a handover was proved.'), expected: 'failed' },
]
const sourceHashes = await Promise.all([...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-self-reference.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].map(async path => ({ path, hash: hashBytes(await readFile(path)) })))
const plan = { authorization: 'User authorizes fictional MiniMax testing without additional spend approval.', jobs, sourceHashes }, hash = hashBytes(JSON.stringify(plan)), run = join('tmp/qa/courtroom/jury-self-reference', `live-${hash}-${Date.now()}`)
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
