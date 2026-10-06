import { readFile, readdir, access } from 'node:fs/promises'
import { join } from 'node:path'
const root = 'tmp/qa/courtroom/full-jury'
const job = process.argv[2], from = Number(process.argv[3] ?? 1), to = Number(process.argv[4] ?? 1000)
const entries = (await readdir(root)).filter(p => p.startsWith('live-')).sort((a, b) => Number(b.split('-').at(-1)) - Number(a.split('-').at(-1)))
let directory = ''
for (const entry of entries) if (await access(join(root, entry, job, 'results.json')).then(() => true).catch(() => false)) { directory = join(root, entry); break }
const base = join(directory, job), data = JSON.parse(await readFile(join(base, 'results.json'), 'utf8'))
for (const [index, actor] of data.actors.entries()) {
  if (index + 1 < from || index + 1 > to || actor.state !== 'finished') continue
  const input = JSON.parse(await readFile(join(base, `${actor.id}-input.json`), 'utf8'))
  if (/<\/?think\b/i.test(JSON.stringify(actor.result))) {
    console.log(JSON.stringify({ id: actor.id, stage: actor.stage, formatError: 'Embedded reasoning: response withheld from display' }))
    continue
  }
  const peerEvents = (input.courtroomEvents ?? []).filter((e: any) => e.type === 'juror_deliberation_turn')
  const responseText = [actor.result.content, ...(actor.result.jurors ?? []).flatMap((j: any) => [j.rationale, j.mindChangedBecause, j.changedByEventId])].join(' ').toLowerCase()
  const referencedPeers = peerEvents.filter((e: any) => e.actorId !== input.courtroomActor?.id && (responseText.includes(e.eventId) || [...responseText.matchAll(/juror[- ]?0?(\d+)\b/g)].some(m => Number(m[1]) === Number(e.actorId.replace(/\D/g, '')))))
  if (referencedPeers.length) console.log(JSON.stringify({ authorizedReferencedPeers: referencedPeers.map((e: any) => ({ eventId: e.eventId, actor: e.actorId, phase: e.phase, contribution: e.payload.contribution })) }))
  if (process.argv.includes('--compact')) {
    const expected = input.packet.match(/instructionEventId: ([^\s.]+)/)?.[1] ?? input.courtroomEvents?.filter((e: any) => e.type === 'judicial_instruction').at(-1)?.eventId
    console.log(JSON.stringify({ job, n: index + 1, title: actor.result.title, speech: actor.result.content, prior: input.courtroomAssessments?.map((a: any) => `${a.round}:${a.choice}`), jurors: actor.result.jurors?.map((j: any) => ({ choice: j.leaning, rationale: j.rationale, reason: j.mindChangedBecause, charge: j.instructionEventId === expected ? 'current' : { actual: j.instructionEventId, expected }, changedBy: j.changedByEventId })), repaired: !actor.firstResponseAccepted }))
    continue
  }
  console.log(JSON.stringify({ id: actor.id, stage: actor.stage, actor: input.courtroomActor?.id, evidence: index + 1 === from ? input.evidence.map((e: any) => ({ exhibit: e.exhibitId, text: e.text })) : input.evidence.map((e: any) => e.exhibitId), assessments: input.courtroomAssessments?.map((a: any) => ({ round: a.round, choice: a.choice })), result: { title: actor.result.title, content: actor.result.content, jurors: actor.result.jurors?.map((j: any) => ({ juror: j.juror, leaning: j.leaning, confidence: j.confidence, rationale: j.rationale, mindChangedBecause: j.mindChangedBecause, instructionEventId: j.instructionEventId, changedByEventId: j.changedByEventId })), verdict: actor.result.verdict }, repaired: !actor.firstResponseAccepted }))
}
