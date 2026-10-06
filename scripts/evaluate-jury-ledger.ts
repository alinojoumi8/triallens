import 'dotenv/config'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes, assertApprovedPlan } from './pilotEvidence'

const root = 'tmp/qa/courtroom/jury-ledger', planPath = join(root, 'plan.json')
if (!process.argv.includes('--live')) {
  const baseline = 'tmp/qa/jury-candidate/tmp/qa/courtroom/full-jury/live-406ba52cb9a95f6dfef0ef7ecfc1718ccb4243b09d5cf036b918389f24811358-1791136855547'
  const input = async (job: string, actor: number) => JSON.parse(await readFile(join(baseline, job, `${job}-actor-${actor}-input.json`), 'utf8'))
  const rowan = await input('hearing-Rowan', 48), morgan = await input('hearing-Morgan', 55), struck = await input('struck-testimony-3', 27), conflicting = await input('conflicting-witnesses-1', 61)
  const control = (id: string, request: unknown, content: string, expected: string) => ({ id, request, original: { title: '', content, citations: [], jurors: [] }, expected, replay: false })
  const negativeRun = (await readdir('tmp/qa/courtroom/jury-negation')).find(n => n.startsWith('live-f3115111'))!
  const originalRowan = JSON.parse(await readFile(join('tmp/qa/courtroom/jury-negation', negativeRun, 'hearing-Rowan-actor-48/results.json'), 'utf8')).generated
  const repairsRoot = 'tmp/qa/jury-followup/tmp/qa/courtroom/jury-repairs'
  const repairRun = (await readdir(repairsRoot)).find(n => n.startsWith('live-c70cf4f4'))!
  const originalStruck = JSON.parse(await readFile(join(repairsRoot, repairRun, 'struck-testimony-3-actor-27/results.json'), 'utf8')).generated
  const priorRun = (await readdir(root)).find(n => n.startsWith('live-a67d3941'))!
  const nonverbatimReply = JSON.parse(await readFile(join(root, priorRun, 'exact-struck-3-27/results.json'), 'utf8')).generated
  const receiptRun = (await readdir(root)).find(n => n.startsWith('live-6f895e61'))!
  const receiptReply = JSON.parse(await readFile(join(root, receiptRun, 'exact-struck-quote/results.json'), 'utf8')).generated
  const framingRun = (await readdir(root)).find(n => n.startsWith('live-6efb3f35'))!
  const framingReply = JSON.parse(await readFile(join(root, framingRun, 'exact-receipt-noun/results.json'), 'utf8')).generated
  const phaseFocus = (await readFile('server/trialEngine.ts', 'utf8')).match(/if \(phase === 'deliberation_challenges'\) return '([^']+)'/)![1]
  const currentProtocol = (request: any) => ({ ...request, packet: request.packet.replace('Challenge one source-grounded proof point raised in the shared deliberation record.', phaseFocus) })
  const quotedPeer = struck.courtroomEvents.find((e: any) => e.type === 'juror_deliberation_turn' && e.actorId === 'juror-05').payload.contribution
  const summaryRun = process.argv.includes('--summary-only') ? (await readdir(root)).find(n => n.startsWith('live-fa2b77c6'))! : null
  const summaryReply = summaryRun ? JSON.parse(await readFile(join(root, summaryRun, 'exact-struck-3-27/results.json'), 'utf8')).generated : null
  const presenceRun = (process.argv.includes('--presence-only') || process.argv.includes('--matrix-repairs')) ? (await readdir(root)).find(n => n.startsWith('live-ee36c5f9'))! : null
  const presenceReply = presenceRun ? JSON.parse(await readFile(join(root, presenceRun, 'protocol-struck-summary/results.json'), 'utf8')).generated : null
  const matrixRoot = 'tmp/qa/jury-ledger-matrix/tmp/qa/courtroom/full-jury'
  const matrixRun = process.argv.includes('--matrix-repairs') ? (await readdir(matrixRoot)).find(n => n.startsWith('live-95b429ae'))! : null
  const safeConcessionInput = matrixRun ? JSON.parse(await readFile(join(matrixRoot, matrixRun, 'missing-essential-proof-2/missing-essential-proof-2-actor-10-input.json'), 'utf8')) : null
  const safeConcession = matrixRun ? JSON.parse(await readFile(join(matrixRoot, matrixRun, 'missing-essential-proof-2/results.json'), 'utf8')).actors.find((a: any) => a.id === 'missing-essential-proof-2-actor-10').grounding : null
  const safeConcessionDraft = safeConcession ? { title: '', content: safeConcession.findings.filter((f: any) => f.unitId.startsWith('content:')).map((f: any) => f.text).join(' '), citations: [], jurors: [{ juror: 'juror-08', rationale: safeConcession.findings.filter((f: any) => f.unitId.startsWith('juror-0:')).map((f: any) => f.text).join(' '), mindChangedBecause: safeConcession.findings.filter((f: any) => f.unitId.startsWith('juror-change-0:')).map((f: any) => f.text).join(' ') }] } : null
  const actualMatrixFailures = matrixRun ? await Promise.all([['conflicting-witnesses-1', 1], ['later-exclusion-1', 5], ['struck-testimony-1', 24], ['conflicting-witnesses-3', 10], ['later-exclusion-3', 3]].map(async ([job, actor]) => {
    const data = JSON.parse(await readFile(join(matrixRoot, matrixRun, String(job), 'results.json'), 'utf8'))
    return { id: `actual-${job}-${actor}`, request: JSON.parse(await readFile(join(matrixRoot, matrixRun, String(job), `${job}-actor-${actor}-input.json`), 'utf8')), original: data.actors.find((a: any) => a.id === `${job}-actor-${actor}`).result, expected: 'failed', replay: false }
  })) : []
  const mixedRun = matrixRun ? (await readdir(root)).find(n => n.startsWith('live-53fec87a'))! : null
  const mixedReply = mixedRun ? JSON.parse(await readFile(join(root, mixedRun, 'protocol-struck-final/results.json'), 'utf8')).generated : presenceReply
  const jobs = process.argv.includes('--matrix-repairs') ? [
    control('nominal-attribution-only', struck, 'Attribution-only material cannot satisfy the Crown burden.', 'failed'),
    control('permitted-attribution-only-basis', struck, 'I assess the source on the permitted attribution-only basis.', 'failed'),
    control('explicit-nonobservation', struck, 'The account itself acknowledges no observation of receipt.', 'failed'),
    control('absence-of-recorded-observation', struck, 'The account does not record an observation of receipt.', 'passed'),
    control('negated-exclusive-attribution', struck, 'E-001 is not exclusively attribution-only; it is permitted for assessment.', 'passed'),
    control('only-misplaced-presence', struck, 'E-001 attributes to Mira only presence at the desk and uncertainty about receipt.', 'failed'),
    control('exact-observation-and-knowledge', struck, 'E-001 records Mira stating: I saw Fictional Ellis standing at the desk. I do not know whether Ellis received any token.', 'passed'),
    { id: 'actual-public-concession', request: safeConcessionInput, original: safeConcessionDraft, expected: 'passed', replay: false },
    ...actualMatrixFailures,
    { id: 'protocol-struck-final', request: currentProtocol(struck), original: mixedReply, expected: 'failed', replay: true },
  ] : process.argv.includes('--presence-only') ? [
    control('misplaced-attributed-presence', struck, 'E-001 attributes to Mira presence at the desk and stated uncertainty about receipt.', 'failed'),
    control('attributed-observed-person', struck, 'E-001 attributes to Mira an observation of Ellis standing at the desk and stated uncertainty about receipt.', 'passed'),
    { id: 'protocol-struck-presence', request: currentProtocol(struck), original: presenceReply, expected: 'failed', replay: true },
  ] : process.argv.includes('--summary-only') ? [
    control('uncertainty-only-summary', struck, "E-001 records only Mira's attributed non-knowledge about any token.", 'failed'),
    control('receipt-scoped-summary', struck, "On receipt, E-001 records only Mira's uncertainty; it also records Ellis standing at the desk.", 'passed'),
    control('nonexhaustive-uncertainty', struck, "E-001 records Mira's stated uncertainty about token receipt.", 'passed'),
    { id: 'protocol-struck-summary', request: currentProtocol(struck), original: summaryReply, expected: 'failed', replay: true },
  ] : process.argv.includes('--framing-only') ? [
    control('invented-shared-framing', struck, "I'll challenge the framing in the shared record that uncertainty equals an established absence of handover.", 'failed'),
    control('current-qualified-assessment', struck, 'The supplied account states uncertainty about receipt; it does not prove that no handover occurred.', 'passed'),
    control('actual-peer-verbatim', struck, `Prior turns said "${quotedPeer}"`, 'passed'),
    { id: 'protocol-struck-framing', request: currentProtocol(struck), original: framingReply, expected: 'failed', replay: true },
    { id: 'protocol-Rowan-48', request: currentProtocol(rowan), original: originalRowan, expected: 'failed', replay: true },
  ] : process.argv.includes('--receipt-only') ? [
    control('receipt-disclaimer-negative', struck, 'E-001 records an explicit receipt disclaimer.', 'failed'),
    control('receipt-knowledge-positive', struck, 'E-001 records Mira stating that she does not know whether Ellis received a token.', 'passed'),
    { id: 'exact-receipt-noun', request: struck, original: receiptReply, expected: 'failed', replay: true },
  ] : [
    control('unraised-proof-point', rowan, "I challenge the proof point that Mira's account proves receipt.", 'failed'),
    control('named-invented-argument', rowan, 'Juror-03 argued that the attributed account establishes the receipt element.', 'failed'),
    control('hypothetical-challenge', rowan, "If someone were to argue that Mira's account proves receipt, I would challenge that inference.", 'passed'),
    control('current-own-assessment', rowan, 'My current assessment is that the supplied attribution-only account leaves the burden unmet.', 'passed'),
    control('actual-peer-argument', morgan, "One argument raised is that E-001 can prove the handover because the instruction only bars contents or guilt. That reading overlooks the binding exclusive-attribution limit.", 'passed'),
    control('invented-binding-ban', struck, 'E-001 is attributed and disputed; the limited-use instruction bars treating it as proof of receipt.', 'failed'),
    control('heldout-charge-ban', struck, 'The charge prohibits using E-001 to prove the supplied receipt condition.', 'failed'),
    control('heldout-cannot-use', struck, 'E-001 cannot be used as substantive proof of receipt.', 'failed'),
    control('individual-insufficiency', struck, 'E-001 is disputed; I find the account insufficient to prove receipt beyond reasonable doubt.', 'passed'),
    control('automatic-finding-limit', struck, 'The instruction bars automatically treating E-001 attribution as proof of receipt.', 'passed'),
    control('multi-witness-permission', conflicting, 'E-001 and E-002 are admitted for assessment as disputed accounts; I assess their disagreement under the supplied burden.', 'passed'),
    control('nonverbatim-peer-quote', struck, "Prior turns called E-001 'uncertainty, not observation of a handover.'", 'failed'),
    control('verbatim-peer-quote', struck, `Prior turns said "${quotedPeer}"`, 'passed'),
    { id: 'exact-Rowan-48', request: rowan, original: originalRowan, expected: 'failed', replay: true },
    { id: 'exact-struck-3-27', request: struck, original: originalStruck, expected: 'failed', replay: true },
    { id: 'exact-struck-quote', request: struck, original: nonverbatimReply, expected: 'failed', replay: true },
  ]
  const files = [...(await readdir('server', { recursive: true })).filter(n => n.endsWith('.ts')).map(n => join('server', n)), 'scripts/evaluate-jury-ledger.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].sort()
  const plan = { authorization: 'User authorized issue repairs and fictional MiniMax testing without further spend approval.', runtime: process.version, jobs, settings: { model: 'MiniMax-M3', temperature: 0, maxOutputTokens: 16000 }, limits: { maxCalls: 500, maxInputCharacters: 100000000, maxElapsedMs: 3600000, requestTimeoutMs: 240000 }, candidateSourceHashes: await Promise.all(files.map(async path => ({ path, sha256: hashBytes(await readFile(path, 'utf8')) }))) }
  await mkdir(root, { recursive: true }); await durableJson(planPath, plan)
  console.log('Prepared ' + jobs.length + ' controls/replays; zero calls. Hash: ' + hashBytes(await readFile(planPath, 'utf8')))
} else {
  const encoded = await readFile(planPath, 'utf8'), hash = process.argv.find(a => a.startsWith('--plan-hash='))?.split('=')[1]
  assertApprovedPlan(encoded, hash); const plan = JSON.parse(encoded)
  if (process.version !== plan.runtime) throw new Error('Runtime changed')
  for (const s of plan.candidateSourceHashes) if (hashBytes(await readFile(s.path, 'utf8')) !== s.sha256) throw new Error('Source changed: ' + s.path)
  Object.assign(process.env, { MODEL_PROVIDER: 'minimax', MODEL_TEMPERATURE: '0', MODEL_MAX_OUTPUT_TOKENS: '16000', MINIMAX_REASONING_EFFORT: 'medium' })
  const run = join(root, 'live-' + hash + '-' + Date.now()); await mkdir(run, { recursive: true }); await durableJson(join(run, 'approved-plan.json'), plan)
  await Promise.all(plan.jobs.map(async (job: any) => {
    const directory = join(run, job.id); await mkdir(directory, { recursive: true })
    const transport = new DurablePilotTransport(directory, plan.limits); let phase = 'control'
    const client = new MiniMaxClient({ ...createMiniMaxConfig(), provider: 'minimax', model: plan.settings.model, timeoutMs: 240000, maxRetries: 3 }, undefined, (input, init) => {
      const body = JSON.parse(String(init?.body)), user = body.messages[1].content as string
      transport.setContext({ caseId: job.id, phase, requestRole: user.startsWith('Stage: factual_verification') ? 'checker' : 'author', draftKind: user.includes('rejected the previous draft.') ? 'repair' : 'original', planHash: hash }); return transport.fetch(input, init)
    })
    const result: any = { id: job.id, state: 'started' }
    try {
      result.review = await client.reviewGrounding(job.request, job.original); result.expectedMatched = result.review.status === job.expected
      if (job.replay) { phase = 'fresh-exact-request'; result.generated = await client.generateStage(job.request) }
      result.state = 'finished'; console.log(job.id + ': expected=' + result.expectedMatched + (job.replay ? ', replay finished' : ''))
    } catch (error) { result.state = 'failed'; result.error = String(error); console.log(job.id + ': ' + String(error)) }
    finally { result.usage = transport.usage(); await durableJson(join(directory, 'results.json'), result); transport.dispose() }
  }))
  console.log('Evidence: ' + run)
}
