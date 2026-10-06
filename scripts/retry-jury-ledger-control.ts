import 'dotenv/config'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'
const root = 'tmp/qa/courtroom/jury-ledger', hash = '6f895e61fe47995a608fc39b94e12976378eb4bb540c055f2096c9bf4005570f'
const folder = (await readdir(root)).find(n => n.startsWith('live-' + hash))!
const base = join(root, folder), encoded = await readFile(join(base, 'approved-plan.json'), 'utf8'), plan = JSON.parse(encoded)
if (hashBytes(encoded) !== hash || process.version !== plan.runtime) throw new Error('Candidate or runtime mismatch')
for (const s of plan.candidateSourceHashes) if (hashBytes(await readFile(s.path, 'utf8')) !== s.sha256) throw new Error('Source changed: ' + s.path)
const job = plan.jobs.find((j: any) => j.id === 'multi-witness-permission'), prior = JSON.parse(await readFile(join(base, job.id, 'results.json'), 'utf8'))
if (prior.state !== 'failed' || !prior.error.includes('request failed (529,')) throw new Error('Only the recorded temporary-provider failure is authorized for this retry')
const directory = join(base, job.id, 'provider-retry-' + Date.now()); await mkdir(directory, { recursive: true })
Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
const transport = new DurablePilotTransport(directory, plan.limits)
transport.setContext({ caseId: job.id, requestRole: 'checker', phase: 'temporary-provider-retry', planHash: hash })
const client = new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: plan.settings.model, timeoutMs: 240000, maxRetries: 3 }, undefined, transport.fetch)
const result: any = { planHash: hash, originalError: prior.error, state: 'started', attempts: [] }
try {
  for (let attempt = 0; ; attempt++) {
    try { result.review = await client.reviewGrounding(job.request, job.original); break }
    catch (error) { result.attempts.push(String(error)); if (attempt >= 3 || !String(error).includes('request failed (529,')) throw error; await new Promise(resolve => setTimeout(resolve, 5000 * (attempt + 1))) }
  }
  result.state = 'finished'; result.expectedMatched = result.review.status === job.expected
} catch (error) { result.state = 'failed'; result.error = String(error) }
finally { result.usage = transport.usage(); await durableJson(join(directory, 'results.json'), result); transport.dispose() }
console.log(JSON.stringify({ directory, state: result.state, expectedMatched: result.expectedMatched, usage: result.usage }))
