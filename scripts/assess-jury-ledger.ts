import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hashBytes } from './pilotEvidence'
const root = 'tmp/qa/courtroom/jury-ledger'
const reviews = JSON.parse(await readFile('docs/qa/jury/ledger-independent-review.json', 'utf8'))
const reports = []
for (const folder of (await readdir(root)).filter(n => n.startsWith('live-'))) {
  const base = join(root, folder), encoded = await readFile(join(base, 'approved-plan.json'), 'utf8'), plan = JSON.parse(encoded), planHash = hashBytes(encoded)
  const jobs = []; let pairs = 0, errors = 0, failed = 0, incomplete = 0, mismatches = 0, knownTokens = 0
  for (const job of plan.jobs) {
    const directory = join(base, job.id)
    let result
    try { result = JSON.parse(await readFile(join(directory, 'results.json'), 'utf8')) } catch { result = { state: 'incomplete' } }
    for (const name of (await readdir(directory, { recursive: true })).filter(n => /^http-\d+$/.test(n.split(/[\\/]/).at(-1) ?? ''))) {
      const http = join(directory, name), exchange = JSON.parse(await readFile(join(http, 'exchange.json'), 'utf8'))
      if (hashBytes(await readFile(join(http, 'request-body.txt'))) !== exchange.requestHash) mismatches++
      if (exchange.state === 'received') { pairs++; if (exchange.httpStatus >= 400) errors++; if (hashBytes(await readFile(join(http, 'response-body.raw'))) !== exchange.responseHash) mismatches++ }
      else if (exchange.state === 'failed') failed++; else incomplete++
      knownTokens += exchange.reportedUsage?.total_tokens ?? 0
    }
    const providerRetries = []
    for (const retry of (await readdir(directory)).filter(n => n.startsWith('provider-retry-'))) {
      try { const r = JSON.parse(await readFile(join(directory, retry, 'results.json'), 'utf8')); providerRetries.push({ directory: retry, state: r.state, expectedMatched: r.expectedMatched, originalError: r.originalError, attempts: r.attempts }) } catch { providerRetries.push({ directory: retry, state: 'incomplete' }) }
    }
    jobs.push({ id: job.id, replay: job.replay, expected: job.expected, state: result.state, expectedMatched: result.expectedMatched, providerRetries, recoveredExpected: result.expectedMatched || providerRetries.some(r => r.expectedMatched), repairs: result.generated?.grounding?.repairs, error: result.error, independentFreshResponseReview: reviews.runs.find((r: any) => r.planHash === planHash)?.jobs.find((r: any) => r.id === job.id) ?? (job.replay ? { status: 'unreviewed' } : null) })
  }
  reports.push({ planHash, jobs, rawIntegrity: { pairs, errors, failed, incomplete, mismatches, knownTokens } })
}
await writeFile('docs/qa/jury/ledger-repair-summary.json', JSON.stringify(reports, null, 2) + '\n')
console.log(JSON.stringify(reports.map(r => ({ hash: r.planHash, matched: r.jobs.filter(j => j.expectedMatched).length, jobs: r.jobs.length, unfinished: r.jobs.filter(j => j.state !== 'finished').map(j => j.id), raw: r.rawIntegrity })), null, 2))
