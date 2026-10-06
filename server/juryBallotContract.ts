import type { StageRequest } from './minimax'
import type { StageResult } from './types'

// A source check approves prose, not ballot metadata. Never infer a causal
// event from text or borrow another juror's/global citation list.
export function validateJuryBallotContract(request: StageRequest, result: StageResult): string[] {
  const contract = request.ballotContract
  if (!request.courtroomProtocol || request.stage !== 'juror_ballot' || !contract) return []
  const errors: string[] = []
  for (const [index, juror] of (result.jurors ?? []).entries()) {
    if (!contract.instructionEventId || juror.instructionEventId !== contract.instructionEventId) errors.push('Acknowledge the current instructionEventId.')
    if (result.grounding?.status === 'passed') {
      const verified = result.grounding.findings.filter(f => ['supported', 'analysis'].includes(f.status) && (f.unitId.startsWith(`juror-${index}:`) || f.unitId.startsWith(`juror-change-${index}:`)))
      for (const exhibitId of new Set(verified.flatMap(f => f.citations.map(c => c.exhibitId)))) {
        if (juror.citations.includes(exhibitId) || !request.evidence.some(e => e.exhibitId === exhibitId)) continue
        juror.citations.push(exhibitId)
        ;(result.grounding.jurorCitationCorrections ??= []).push({ jurorIndex: index, exhibitId, unitIds: verified.filter(f => f.citations.some(c => c.exhibitId === exhibitId)).map(f => f.unitId) })
      }
    }
    const outcomes = contract.permittedOutcomes
    const choice = juror.leaning === 'crown' ? outcomes.find(o => ['guilty', 'proved', 'yes', 'liable'].includes(o)) ?? outcomes[0]
      : juror.leaning === 'defence' ? outcomes.find(o => ['not_guilty', 'not_proved', 'no', 'not_liable'].includes(o)) ?? outcomes[1]
      : request.ballotRound === 'initial' ? 'undecided' : outcomes.find(o => ['no_verdict', 'no_finding', 'no_decision'].includes(o)) ?? outcomes.at(-1)
    if (request.ballotRound !== 'final' || contract.initialChoice === undefined || choice === contract.initialChoice) continue
    const event = contract.events.find(e => e.eventId === juror.changedByEventId)
    if (!event || !juror.mindChangedBecause?.trim() || !event.exhibitIds.some(id => juror.citations.includes(id))) {
      errors.push(`A changed final ballot requires an eligible visible deliberation event, a concise explanation, and a shared permitted citation in this juror's citations. Eligible events: ${JSON.stringify(contract.events)}. Do not use a limiting instruction as the deliberation event.`)
    }
  }
  return errors
}
