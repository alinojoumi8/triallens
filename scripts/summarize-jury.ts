import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { contextHash } from '../server/actorMemory'
import { hashBytes } from './pilotEvidence'
const arg = (name: string) => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3)
const root = arg('root') ?? 'tmp/qa/courtroom/full-jury'
const sourceRoot = arg('source-root') ?? process.cwd()
const output = arg('output') ?? 'docs/qa/jury/evidence-summary.json'
const summaries: unknown[] = []
for (const entry of (await readdir(root)).filter(p => p.startsWith('live-')).sort()) {
  const directory = join(root, entry), plan = JSON.parse(await readFile(join(directory, 'approved-plan.json'), 'utf8'))
  let pairs = 0, httpErrors = 0, failed = 0, incomplete = 0, hashMismatches = 0, knownTokens = 0, inputMismatches = 0, nativeManifests = 0, manifestMismatches = 0, legalPacketMismatches = 0, committedOutputMismatches = 0
  const trials = []
  async function http(path: string) {
    const authorDrafts = new Map<string, number>()
    for (const p of (await readdir(path)).filter(p => p.startsWith('http-'))) {
      const base = join(path, p), x = JSON.parse(await readFile(join(base, 'exchange.json'), 'utf8'))
      if (hashBytes(await readFile(join(base, 'request-body.txt'))) !== x.requestHash) hashMismatches++
      if (x.state === 'received') { pairs++; if (x.httpStatus < 200 || x.httpStatus >= 300) httpErrors++; if (hashBytes(await readFile(join(base, 'response-body.raw'))) !== x.responseHash) hashMismatches++ }
      else if (x.state === 'failed') failed++; else incomplete++
      knownTokens += x.reportedUsage?.total_tokens ?? 0
      if (x.state === 'received' && x.httpStatus >= 200 && x.httpStatus < 300 && x.requestRole === 'author' && x.actorRequestId) authorDrafts.set(x.actorRequestId, (authorDrafts.get(x.actorRequestId) ?? 0) + 1)
    }
    return authorDrafts
  }
  for (const c of await readdir(join(directory, 'controls')).catch(() => [])) await http(join(directory, 'controls', c))
  for (const job of plan.jobs) {
    const base = join(directory, job.id)
    const data = await readFile(join(base, 'results.json'), 'utf8').then(JSON.parse).catch(() => null)
    if (!data) continue
    const authorDrafts = await http(base)
    const inputs = new Map()
    for (const actor of data.actors) {
      const input = JSON.parse(await readFile(join(base, `${actor.id}-input.json`), 'utf8'))
      if (contextHash(input) !== actor.inputHash) inputMismatches++
      inputs.set(contextHash(input), { actor, input })
    }
    for (const e of data.result?.events ?? []) if (e.modelAudit?.contextManifest) {
      nativeManifests++
      const candidate = inputs.get(e.modelAudit.contextManifest.inputHash)
      if (!candidate) manifestMismatches++
      if (candidate && candidate.input.packet.match(/Pinned legal packet ([a-f0-9]+):/)?.[1] !== e.modelAudit.contextManifest.legalPacketHash) legalPacketMismatches++
      if (candidate?.actor.state === 'finished' && e.type === 'witness_answer' && e.payload.text !== candidate.actor.result.content) committedOutputMismatches++
      if (candidate?.actor.state === 'finished' && e.type === 'juror_deliberation_turn' && e.payload.contribution !== (candidate.actor.result.jurors[0]?.rationale ?? candidate.actor.result.content)) committedOutputMismatches++
    }
    trials.push({ ...job, actors: data.actors.length, accepted: data.actors.filter((a: any) => a.state === 'finished').length, sourceRepairFlagFirstAccepted: data.actors.filter((a: any) => a.firstResponseAccepted).length, firstReceivedDraftAccepted: data.actors.filter((a: any) => a.state === 'finished' && authorDrafts.get(a.id) === 1).length, acceptedRegeneratedDrafts: data.actors.filter((a: any) => a.state === 'finished' && (authorDrafts.get(a.id) ?? 0) > 1).length, successfulAuthorResponses: [...authorDrafts.values()].reduce((sum, count) => sum + count, 0), repaired: data.actors.filter((a: any) => a.state === 'finished' && !a.firstResponseAccepted).length, failures: data.actors.filter((a: any) => a.state === 'failed').map((a: any) => ({ id: a.id, stage: a.stage, error: a.error })), checks: data.result?.checks, error: data.result?.error, ballots: data.result?.ballots?.length ?? 0, changedFinalBallots: (data.result?.ballots ?? []).filter((b: any) => b.round === 'final' && b.choice !== data.result.ballots.find((i: any) => i.actorId === b.actorId && i.issueId === b.issueId && i.round === 'initial')?.choice).length, decision: data.result?.decisionSheet?.decisions.map((d: any) => ({ outcome: d.outcome, complete: d.complete, counts: d.voteCounts })), usage: data.usage })
  }
  const drift = []
  for (const s of plan.candidateSourceHashes) if (hashBytes(await readFile(join(sourceRoot, s.path), 'utf8')) !== s.sha256) drift.push(s.path)
  summaries.push({ directory, planHash: hashBytes(await readFile(join(directory, 'approved-plan.json'), 'utf8')), schedulingStop: await readFile(join(directory, 'overlap-scheduling-stop.json'), 'utf8').then(JSON.parse).catch(() => null), independentStop: await readFile(join(directory, 'independent-stop.json'), 'utf8').then(JSON.parse).catch(() => null), controls: await readFile(join(directory, 'controls.json'), 'utf8').then(JSON.parse).then(c => ({ executed: c.length, matched: c.filter((x: any) => x.matchesExpected).length, transportRetries: c.reduce((sum: number, x: any) => sum + (x.transportRetries?.length ?? 0), 0), transportErrors: c.filter((x: any) => x.error).map((x: any) => ({ id: x.id, error: x.error })) })).catch(() => null), trials, rawIntegrity: { pairs, httpErrors, failed, incomplete, hashMismatches, knownTokens, inputMismatches, nativeManifests, manifestMismatches, legalPacketMismatches, committedOutputMismatches }, drift })
}
await mkdir('docs/qa/jury', { recursive: true })
await writeFile(output, JSON.stringify(summaries, null, 2) + '\n')
console.log(JSON.stringify(summaries, null, 2))
