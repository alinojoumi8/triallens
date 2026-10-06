import { authorisedRecord, contextHash, projectParticipantMemory, type MemoryInput } from './actorMemory'
import type { ActorContextManifest } from './courtroomTypes'

// Filter before serialisation. Rebuild from the pinned record; cached summaries
// are never an authority for access or for the current permitted use of evidence.
export function assembleActorContext(input: MemoryInput, characterBudget = 240_000) {
  const record = authorisedRecord(input)
  const memory = projectParticipantMemory(input)
  const previousTurns = memory.records.map(r => `${r.eventId} ${r.kind}: ${JSON.stringify(r.payload)}`).join('\n')
  const size = previousTurns.length + JSON.stringify(record.evidence).length
  if (size > characterBudget) throw new Error(`Actor context exceeds its ${characterBudget} character budget; no material was silently omitted. Narrow the authorised retrieval before resuming.`)
  const manifest: ActorContextManifest = {
    schemaVersion: 1, runId: input.runId, actorId: input.actorId, throughSequence: input.throughSequence,
    projectionHash: memory.projectionHash, contextHash: contextHash({ previousTurns, evidence: record.evidence }), inputHash: '',
    eventRefs: record.events.map(e => ({ id: e.id, hash: contextHash(e) })), sourceRefs: record.evidence.map(e => ({ evidenceId: e.id, hash: contextHash(e) })),
    retrieval: 'all-authorised-records-v1', characterBudget, omittedEventIds: [],
  }
  return { events: record.events, evidence: record.evidence, memory, manifest, previousTurns }
}
