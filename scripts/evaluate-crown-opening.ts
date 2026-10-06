import 'dotenv/config'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createCourtroomFixture } from '../samples/courtroom-realism/fixture'
import { MiniMaxClient, createMiniMaxConfig, cleanModelJsonText, type StageRequest } from '../server/minimax'
import { DurablePilotTransport, assertApprovedPlan, durableJson } from './pilotEvidence'
import { groundingUnits, type GroundingReview } from '../server/grounding'
import { contextHash } from '../server/actorMemory'

const directory = 'tmp/qa/courtroom/crown-opening'
const planPath = `${directory}/prepared-plan.json`
const digest = (text: string) => createHash('sha256').update(text).digest('hex')
await mkdir(directory, { recursive: true })
if (!process.argv.includes('--live')) {
  const priorEncoded = await readFile(planPath, 'utf8').catch(() => undefined)
  const priorPlan = priorEncoded ? JSON.parse(priorEncoded) : undefined
  let request: StageRequest | undefined = priorPlan?.request
  if (!request) {
    const f = createCourtroomFixture({ async generateStage(r) { request = r; throw new Error('Offline opening capture stop.') } })
    try { await f.engine.runAutonomous(f.run.id) } catch { /* no transport involved */ }
    f.store.close()
  }
  if (!request) throw new Error('Crown opening task was not captured.')
  request = { ...request, runConfig: { ...request.runConfig!, providerMode: 'external', externalDisclosureConfirmed: true } }
  const serverSources = (await readdir('server', { recursive: true })).filter(path => path.endsWith('.ts')).map(path => join('server', path))
  const plan = {
    authorization: 'PENDING fresh user authorization; preparation is not permission to spend.',
    fixture: 'Original limited-purpose notice, unchanged; development data.',
    attempts: 3,
    allocation: [1, 2, 3].map(attempt => ({ attempt, caseId: 'original-limited-notice', dataClass: 'development' })),
    stopConditions: 'Complete the three independent attempts even if an actor output is withheld. Stop on aggregate resource limits, cancellation or evidence-capture failure. Preserve unexecuted attempts. Never retry until green or tune inside this evaluation. No automatic full hearing.',
    provider: { name: 'minimax', model: 'MiniMax-M3', baseUrl: 'https://api.minimax.io/v1', timeoutMs: 120000, maxRetries: 1 },
    settings: { temperature: 0, maxOutputTokens: 16000, reasoningEffort: 'medium' },
    budget: { maxCalls: 24, maxInputCharacters: 2000000, maxElapsedMs: 720000 },
    allowance: 'Per attempt: up to two author requests (initial + one repair), up to two checks per author (initial + one checker-format correction) = six. Two extra transport requests reserved conservatively; the current client shares the single outer retry across transport and author repair rather than adding an independent retry loop. Hard aggregate cap 24.',
    successRule: 'Proceed to separately authorized visible-browser hearing only if all three attempts yield useful source-supported output, no unresolved factual findings, and at least two pass first-response verification. Any withheld or transport-failed attempt prevents progression. Independent review still required.',
    request,
    inputHash: contextHash(request),
    sourceHashes: request.evidence.map(e => ({ exhibitId: e.exhibitId, sha256: digest(e.text) })),
    candidateSourceHashes: await Promise.all([...serverSources, 'samples/courtroom-realism/fixture.ts', 'scripts/evaluate-crown-opening.ts', 'scripts/pilotEvidence.ts', 'package-lock.json'].sort().map(async path => ({ path, sha256: digest(await readFile(path, 'utf8')) }))),
    runtime: { node: process.version },
    usage: { previousLongTimeoutRun: { httpCalls: 4, reportedTokens: 18718, elapsedSeconds: 107.22 }, tokenAndCostLimitations: 'Provider reports usage when available; timeout usage may be missing. At 16,000 output tokens per HTTP response, the theoretical response cap is 384,000 tokens plus input; actual totals and monetary cost are unknown. No dollar cap is enforced.' },
    pricing: { officialSource: 'https://platform.minimax.io/docs/pricing/overview', checkedOn: '2026-10-03', standardUnder512k: { inputUsdPerMillion: 0.30, outputUsdPerMillion: 1.20, cacheReadUsdPerMillion: 0.06 }, billingArrangement: 'Unknown: API key does not identify pay-as-you-go versus subscription; account billing not inspected.', estimatedOnly: true, enforcedDollarCap: null, terms: 'User stated no MiniMax call/spending limit; execution scope clarification pending. The fixed pilot methodological resource ceilings remain unchanged. Actual account charges and canceled-request billing are unknown.' },
    evidencePolicy: 'Local ignored artifacts: exact serialized body before dispatch, streamed raw application-visible response bytes, allowlisted request IDs, usage, timestamps and hashes; every attempted exchange and partial/canceled response is flushed as execution proceeds. Auth headers, cookies and credentials are never included. Power/process kill can leave a dispatching journal; local cancellation cannot guarantee provider computation or billing stops.',
  }
  const encoded = JSON.stringify(plan, null, 2) + '\n'
  if (priorEncoded) await writeFile(`${directory}/prepared-plan-before-${digest(priorEncoded)}.json`, priorEncoded)
  await writeFile(planPath, encoded)
  await writeFile(`${directory}/prepared-plan.sha256`, digest(encoded) + '\n')
  console.log(`Prepared offline, no provider calls: ${planPath}\nPlan SHA-256: ${digest(encoded)}\nFresh approval required for 3 attempts, <=24 HTTP calls, <=12 minutes; cost unknown.`)
} else {
  // Never reuse EVAL_EXTERNAL_DISCLOSURE_CONFIRMED or previous spending consent.
  const encoded = await readFile(planPath, 'utf8')
  const approvedHash = process.argv.find(arg => arg.startsWith('--approved-plan-hash='))?.split('=')[1]
  assertApprovedPlan(encoded, approvedHash)
  const plan = JSON.parse(encoded)
  if (process.version !== plan.runtime.node) throw new Error('Node runtime changed; prepare and approve a new plan.')
  for (const entry of plan.candidateSourceHashes) if (digest(await readFile(entry.path, 'utf8')) !== entry.sha256) throw new Error(`Candidate changed: ${entry.path}. Prepare and obtain approval for a new plan.`)
  process.env.MODEL_PROVIDER = 'minimax'
  process.env.MODEL_TEMPERATURE = String(plan.settings.temperature)
  process.env.MODEL_MAX_OUTPUT_TOKENS = String(plan.settings.maxOutputTokens)
  process.env.MINIMAX_REASONING_EFFORT = plan.settings.reasoningEffort
  const configuration = createMiniMaxConfig()
  const runDirectory = `${directory}/live-${approvedHash}-${Date.now()}`
  await mkdir(runDirectory, { recursive: true })
  await writeFile(`${runDirectory}/approved-plan.json`, encoded)
  const transport = new DurablePilotTransport(runDirectory, { ...plan.budget, requestTimeoutMs: plan.provider.timeoutMs })
  const cancel = () => transport.cancel('Pilot canceled by process signal.')
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel)
  const attempts: Array<Record<string, unknown>> = plan.allocation.map((entry: Record<string, unknown>) => ({ ...entry, state: 'unexecuted' }))
  const save = () => durableJson(`${runDirectory}/pilot.json`, { label: 'New live task only; not a full hearing or legal certification.', approvedPlanHash: approvedHash, inputHash: plan.inputHash, attempts, aggregateUsage: transport.usage(), independentBehavioralReview: null, qualifiedLegalReview: null, releaseReady: false })
  await save()
  try { for (let attempt = 1; attempt <= 3; attempt++) {
    const exchanges: Array<{ requestHash: string; requestBody: unknown; response?: unknown; reportedTokens?: number; error?: string; elapsedMs?: number }> = []
    const before = transport.usage()
    const start = performance.now()
    attempts[attempt - 1].state = 'started'
    await save()
    let generation = 0
    let draftKind = 'original'
    const client = new MiniMaxClient({ ...configuration, ...plan.provider, provider: 'minimax' }, undefined, async (input, init) => {
      const row: typeof exchanges[number] = { requestHash: digest(String(init?.body)), requestBody: JSON.parse(String(init?.body)) }
      exchanges.push(row)
      const body = row.requestBody as { messages: Array<{ content: string }> }
      const checker = body.messages[1].content.startsWith('Stage: factual_verification')
      if (!checker) {
        generation++
        draftKind = body.messages[1].content.includes('The independent source check rejected the previous draft.') ? 'repair' : 'original'
      }
      transport.setContext({ attempt, actorInputHash: plan.inputHash, generation, requestRole: checker ? 'checker' : 'author', draftKind, approvedPlanHash: approvedHash })
      const started = performance.now()
      try {
        const response = await transport.fetch(input, init)
        const payload = await response.clone().json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number } } | null
        const content = payload?.choices?.[0]?.message?.content
        try { row.response = content ? JSON.parse(cleanModelJsonText(content)) : { note: 'No response content.' } }
        catch { row.response = { note: 'Invalid response JSON; left for the unchanged provider parser to handle. Raw content not retained.' } }
        row.reportedTokens = payload?.usage?.total_tokens
        await durableJson(join(runDirectory, `http-${String(transport.usage().providerHttpCalls).padStart(4, '0')}`, 'derived-output.json'), { label: 'Derived parsed output; cleanModelJsonText may remove reasoning/format wrappers. Exact application-visible bytes retained separately.', attempt, generation, requestRole: checker ? 'checker' : 'author', parsed: row.response })
        return response
      } catch (error) {
        row.error = error instanceof Error ? error.message : String(error)
        if (['ENOSPC', 'EACCES', 'EROFS', 'EIO'].includes((error as { code?: string }).code ?? '')) transport.cancel('Pilot canceled because evidence capture failed.')
        throw error
      }
      finally { row.elapsedMs = performance.now() - started }
    })
    let result: Awaited<ReturnType<MiniMaxClient['generateStage']>> | undefined
    let error: string | undefined
    let review: GroundingReview | undefined
    try { result = await client.generateStage(plan.request); review = result.grounding }
    catch (failure) { error = failure instanceof Error ? failure.message : String(failure); review = (failure as { grounding?: GroundingReview }).grounding }
    const after = transport.usage()
    const useful = Boolean(result && groundingUnits(result).some(unit => unit.id.startsWith('content')) && review?.findings.some(f => f.status === 'supported'))
    const transportFailure = exchanges.some(row => row.error)
    attempts[attempt - 1] = { attempt, caseId: 'original-limited-notice', state: 'finished', inputHash: plan.inputHash, firstResponseSuccess: Boolean(useful && review?.status === 'passed' && review.repairs === 0 && !transportFailure), successAfterRepair: Boolean(useful && review?.status === 'passed' && review.repairs === 1), withheld: !result && Boolean(review), timeoutOrTransportFailure: transportFailure, budgetStopped: Boolean(error?.includes('budget')), useful, independentClaimAssessment: null, error, result, finalAudit: review,
      usage: { httpCalls: after.providerHttpCalls - before.providerHttpCalls, reportedTokens: exchanges.every(e => typeof e.reportedTokens === 'number') ? exchanges.reduce((sum, e) => sum + e.reportedTokens!, 0) : null, elapsedMs: performance.now() - start, cost: null }, exchanges }
    await save()
    console.log(`Attempt ${attempt}: ${error ?? (useful ? 'source-supported result; human review pending' : 'not sufficiently useful')}`)
    if (error?.match(/budget|canceled|deadline/i)) break
  } } finally { await save(); transport.dispose(); process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel) }
}
