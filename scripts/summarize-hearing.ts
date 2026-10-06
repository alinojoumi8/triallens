import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { contextHash } from '../server/actorMemory'
const hash = (x: string | Buffer) => createHash('sha256').update(x).digest('hex')
const root = 'tmp/qa/courtroom/scoped-hearing'
const entries = (await readdir(root)).filter(p => p.startsWith('live-')).sort()
const summaries = []
for (const entry of entries) {
  const directory = join(root, entry), result = JSON.parse(await readFile(join(directory, 'results.json'), 'utf8'))
  const plan = JSON.parse(await readFile(join(directory, 'approved-plan.json'), 'utf8'))
  let pairs = 0, failed = 0, incomplete = 0, mismatches = 0, knownTokens = 0, nativeManifests = 0, manifestMismatch = 0, legalPacketMismatch = 0, inputMismatch = 0, answersChanged = 0
  for (const http of (await readdir(directory)).filter(p => p.startsWith('http-'))) {
    const path = join(directory, http), exchange = JSON.parse(await readFile(join(path, 'exchange.json'), 'utf8'))
    if (hash(await readFile(join(path, 'request-body.txt'))) !== exchange.requestHash) mismatches++
    if (exchange.state === 'received') { pairs++; if (hash(await readFile(join(path,'response-body.raw'))) !== exchange.responseHash) mismatches++ }
    else { if (exchange.state === 'failed') failed++; else incomplete++; if (exchange.partialResponseHash && hash(await readFile(join(path,'response-body.raw')).catch(() => Buffer.alloc(0))) !== exchange.partialResponseHash) mismatches++ }
    knownTokens += exchange.reportedUsage?.total_tokens ?? 0
  }
  const inputs = new Map()
  for (const actor of result.actors) {
    const input = JSON.parse(await readFile(join(directory, `${actor.id}-input.json`), 'utf8'))
    if (hash(JSON.stringify(input)) !== actor.inputHash) inputMismatch++
    inputs.set(contextHash(input), { actor, input })
  }
  for (const hearing of result.hearings) for (const event of hearing.events) if (event.modelAudit?.contextManifest) {
    nativeManifests++
    const candidate = inputs.get(event.modelAudit.contextManifest.inputHash)
    if (!candidate) manifestMismatch++
    if (candidate && candidate.input.packet.match(/Pinned legal packet ([a-f0-9]+):/)?.[1] !== event.modelAudit.contextManifest.legalPacketHash) legalPacketMismatch++
    if (event.type === 'witness_answer' && candidate && event.payload.text !== candidate.actor.result?.content) answersChanged++
  }
  const sourceDrift = []
  for (const source of plan.candidateSourceHashes) if (hash(await readFile(source.path, 'utf8')) !== source.sha256) sourceDrift.push(source.path)
  const independentStop = await readFile(join(directory, 'independent-stop.json'),'utf8').then(JSON.parse).catch(()=>null)
  summaries.push({ directory, planHash: result.planHash, controls: result.checks.length, matches: result.checks.filter((x: any) => x.matchesExpected).length,
    actors: result.actors.length, accepted: result.actors.filter((x: any) => x.state === 'finished').length, firstAccepted: result.actors.filter((x: any) => x.firstResponseAccepted).length,
    acceptedAfterRepair: result.actors.filter((x: any) => x.state === 'finished' && !x.firstResponseAccepted).length,
    failedActors: result.actors.filter((x: any) => x.state === 'failed').map((x: any) => ({ id:x.id, stage:x.stage, error:x.error })),
    hearings: result.hearings.map((h: any) => ({ variant:h.variant, checks:h.checks, error:h.error, manualContinuations:h.manualContinuations })),
    usage: result.usage, usageIsFinal: incomplete === 0 && !independentStop, knownReportedTokenSum: knownTokens, independentStop, rawIntegrity: { pairs, failedExchanges:failed, incompleteExchanges:incomplete, hashMismatches:mismatches, inputMismatch, nativeManifests, manifestMismatch, legalPacketMismatch, answersChanged }, currentSourceDrift:sourceDrift })
}
await mkdir('docs/qa/hearing', {recursive:true})
await writeFile('docs/qa/hearing/evidence-summary.json', JSON.stringify(summaries,null,2)+'\n')
console.log(JSON.stringify(summaries.map(s => ({plan:s.planHash,controls:`${s.matches}/${s.controls}`,accepted:s.accepted,usage:s.usage,integrity:s.rawIntegrity,sourceDrift:s.currentSourceDrift.length})),null,2))
