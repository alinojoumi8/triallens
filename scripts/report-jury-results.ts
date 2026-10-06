import { readFile, writeFile } from 'node:fs/promises'
const json = async (path:string) => JSON.parse(await readFile(path,'utf8'))
const baseline = (await json('docs/qa/jury/evidence-summary.json')).filter((x:any)=>['995f16947b1a26504d1e2cb933358ef3235daca84471d9f87845bf54b20fc000','529e278ee81e4626fdd586fab62d02c9684d1c5991f188f1ebe6069ec9800ac0'].includes(x.planHash))
const fresh = (await json('docs/qa/jury/patched-evidence-summary.json')).find((x:any)=>x.planHash==='406ba52cb9a95f6dfef0ef7ecfc1718ccb4243b09d5cf036b918389f24811358')
if(!fresh||fresh.trials.length!==14||fresh.trials.some((t:any)=>!t.checks))throw new Error('Fresh evaluations have not all reached terminal results.')
if(baseline.reduce((n:number,x:any)=>n+x.trials.length,0)!==14||baseline.some((x:any)=>x.trials.some((t:any)=>!t.checks)))throw new Error('Baseline evaluations have not all reached terminal results.')
const review=await json('docs/qa/jury/patched-independent-review.json'), repairs=await json('docs/qa/jury/targeted-repair-summary.json'), validation=await json('docs/qa/jury/final-validation.json')
const negation=await json('docs/qa/jury/negation-repair-summary.json')
const finalNegation=negation.find((r:any)=>r.planHash==='0b1953243c44a223ef8e4f453209296778e66575b3d24098ef6197dacff2319d')
const mechanical=(t:any)=>!t.error&&Object.values(t.checks).every(Boolean)
const reviewed=(job:string)=>[...new Set(review.groups.filter((g:any)=>g.job===job).flatMap((g:any)=>g.actors))]
const failed=(job:string)=>[...new Set(review.groups.filter((g:any)=>g.job===job).flatMap((g:any)=>g.failed??[]))]
const families=['conflicting-witnesses','later-exclusion','struck-testimony','missing-essential-proof']
const matrix=fresh.trials.map((t:any)=>'| '+t.id+' | '+(mechanical(t)?'pass':'FAIL')+' | rejected | '+reviewed(t.id).length+'/'+t.actors+' | '+failed(t.id).join(', ')+' | '+t.decision.map((d:any)=>d.outcome+' '+JSON.stringify(d.counts)).join('; ')+' |').join('\n')
const familyRows=families.map(f=>'| '+f+' | 0/3 | false | false |').join('\n')
const raw=JSON.stringify(fresh.rawIntegrity,null,2)
const totalTrials=baseline.reduce((n:number,x:any)=>n+x.trials.length,0)+fresh.trials.length
const accepted=fresh.trials.reduce((n:number,t:any)=>n+t.accepted,0), first=fresh.trials.reduce((n:number,t:any)=>n+t.firstAccepted,0), repaired=fresh.trials.reduce((n:number,t:any)=>n+t.repaired,0)
const changed=fresh.trials.reduce((n:number,t:any)=>n+t.changedFinalBallots,0)
const latest=repairs.find((r:any)=>r.planHash==='c70cf4f4c4cc3122dfd7d546144cbcfce7010ce4b7b0eb07d33cbfa2c26e8c8e')
const text=`# Full courtroom and jury evaluation — 2026-10-04

Steps 1–3 were implemented and evaluated using fictional MiniMax-M3 fixtures. Completion of this work does not mean the quality gate passed. The fresh full-trial candidate has ${fresh.trials.filter(mechanical).length}/14 mechanical passes and **0/14 independent response-quality passes**. Later targeted fixes address observed failures, but they have not been validated by another complete persisted 14-trial run.

## Scope and versions

- Baseline hearing candidate: \`995f16947b1a26504d1e2cb933358ef3235daca84471d9f87845bf54b20fc000\`: two full live hearings. The parent runner was deliberately stopped after both finished to avoid duplicating the separately scheduled scenario jobs; its process exit was not a hearing failure.
- Baseline prepared-record candidate: \`529e278ee81e4626fdd586fab62d02c9684d1c5991f188f1ebe6069ec9800ac0\`: four scenario families × three runs, same production sources as the baseline hearings. Its controls reused the baseline 64/64 result.
- Fresh full candidate: \`406ba52cb9a95f6dfef0ef7ecfc1718ccb4243b09d5cf036b918389f24811358\`: 80/80 checker controls, two full hearings and twelve prepared-record jury trials. Fourteen independent trials ran concurrently; each jury stayed serial.
- Follow-up targeted candidates: \`eda54068f0e17c2f7f02e75fd7a79b2629f50f3fac3501234b4324e16d237955\` (six replays), \`ab2a382afd84aa1fe6fd82773ff0a400bd82c43c10e4ab74c5abb40d13e21e76\` (nine), and \`c70cf4f4c4cc3122dfd7d546144cbcfce7010ce4b7b0eb07d33cbfa2c26e8c8e\` (twelve). Requests are the actual fictional inputs that produced observed failures, not substituted sources.
- ${totalTrials} full/record-based trial executions across baseline and fresh candidates. Raw first drafts, repairs, checker exchanges, SQLite state, native audit manifests and decisions remain under ignored \`tmp/qa\` directories. Frozen baseline and fresh runtime copies remain available.
- Full hearings include live openings, objection/ruling, direct/cross/re-examination, closings and jury stages. Prepared-record scenarios exercise live advocacy/jury generation against fixed records; they do not generate live witness testimony. Exclusion and striking happen before the jury sees the record, so these runs do not establish mid-deliberation unlearning.
- QA controls execute the prepared ruling effects and counsel stop controls. Do not describe them as autonomous legal adjudication. No actual-law certification, real-case data, provider-default change or deployment.

## Implementation and TDD

Failing regressions were reproduced before fixes. The verifier now preserves handover conduct versus unsupplied knowing-participation elements, pleaded-status boundaries, contents uncertainty, physical non-observation, knowledge timing, source classification, actual witness/giver/observed-person identities, source-use permissions, and exclusive-attribution proof limits. It also checks actual prior Defence submissions and plea records rather than inferring them from advocate identity.

Native isolated jury responses must acknowledge the actual current instruction and provide an untruncated concise change/stability reason. Scope rulings for an absent jury preserve the exact pending instruction as a future delivery step. Schema-placeholder speech is rejected and regenerated. Persisted deliberation turns retain instruction IDs and change reasons, and evaluation checks all 36 deliberation instruction IDs alongside 24 ballot IDs.

Each fresh full hearing exhausted source-repair attempts for one legitimate deliberation reply. Inspection showed a verifier false positive: 'no supplied foundation to meet BRD' and 'no corroborating exhibit ... to satisfy the receipt element' were wrongly classified as positive proof assertions. These frozen-run failures and withheld replies remain in the results. A subsequent RED/GREEN fix distinguishes the negated subject from a positive proof predicate, retaining rejection of actual positive proof claims. Actual-request live controls/replays are retained in the negation evaluation; no prepared text replaced a withheld reply.

Relevant runtime files: \`server/grounding.ts\`, \`server/minimax.ts\`, \`server/trialEngine.ts\`, \`samples/courtroom-realism/fixture.ts\`, \`scripts/hearingEvaluation.ts\`, and \`scripts/juryEvaluation.ts\`. Evaluation/review helpers and regression tests accompany them. Unrelated existing working-tree changes were preserved.

## Validation

${JSON.stringify(validation,null,2)}

Earlier RED results are expected TDD checkpoints. An isolated copied-runtime browser attempt failed because its Vite config had not been copied; the setup was corrected and the browser suite rerun successfully. That failed attempt is not reported as a product pass.

## Fresh full-trial results

${accepted} accepted actor responses: ${first} first responses accepted; ${repaired} accepted after repair. These are provider/verifier acceptance statistics, not independent semantic pass rates.

| Trial | Mechanics | Independent quality | Actors reviewed | Observed failed actor numbers | Persisted decision |
|---|---|---|---|---|---|
${matrix}

Independent root review was fail-fast per trial: once a material error rejected a trial, later outputs remained retained but did not require exhaustive manual grading. ${review.groups.reduce((n:number,g:any)=>n+g.actors.length,0)} actor outputs were independently inspected. Unreviewed outputs are not counted passed. Minor editorial risks were distinguished from substantive failures, and no preferred guilty/not-guilty outcome was imposed.

Observed failures include an invented plea, an invented prior Defence submission, a witness/giver reversal, an exhaustive account summary dropping unknown contents, uncertainty rewritten as non-observation or denied receipt, non-observation rewritten as event absence, and invented prior proof points. One trial failed for literal schema-placeholder speech. Broad admitted accounts must remain eligible for the supplied disputed-account assessment; they must not be assigned the full-hearing fixture's exclusive-attribution prohibition.

| Prepared-record family | Clean trials | pass@3 (at least one clean run) | pass^3 (all three clean) |
|---|---|---|---|
${familyRows}

Baseline mechanics: ${baseline.flatMap((x:any)=>x.trials).filter(mechanical).length}/14. Baseline independent review was partial and had already found material failures; do not infer clean family scores from the baseline.

## Targeted follow-up

Latest targeted candidate: ${latest?.jobs.length??0} completed actor replays; ${latest?.jobs.filter((j:any)=>j.observedFailureRejected).length??0} original observed failures rejected by the combined source/format checks. Placeholder rejection is a format check, not a factual source-check success. First-accepted and repaired responses, original-source acceptance failures, and independent follow-up review details are retained in \`targeted-repair-summary.json\`.

These replays verify specific repairs on their exact requests. They are not another full hearing or twelve complete jury trials and cannot upgrade the rejected fresh candidate to a release-quality pass.

Latest negation candidate: \`0b1953243c44a223ef8e4f453209296778e66575b3d24098ef6197dacff2319d\`. Both actual legitimate replies were accepted and both mixed-clause positive-proof controls rejected (4/4 expected outcomes). Both fresh exact-request replays passed independent review with wording risks. The earlier negation candidate passed the same source calibration, but one fresh replay invented a prior proof point and was independently rejected; that result remains preserved. This is targeted calibration, not a replacement for either withheld deliberation turn in the frozen full run.

Final negation evidence: ${JSON.stringify(finalNegation?.rawIntegrity)}. Detailed per-response reviews and earlier failed replies are retained in \`negation-independent-review.json\` and \`negation-repair-summary.json\`.

Each frozen fresh hearing persisted a decision and 24 ballots, but only 35 of the required 36 deliberation turns. Its missing turn also prevents the 36-turn instruction-version check from passing. A persisted decision does not override these failed mechanical checks.

Independent whole-response review of the latest targeted set passes eleven of twelve fresh responses. The struck-testimony-3 actor27 replay removes its original invented proof point but introduces a different error: its rationale says the limited-use instruction bars treating E-001 as proof of receipt, replacing permission to assess a disputed account with a stronger prohibition. That response remains rejected.

## Evidence integrity and limits

Fresh candidate integrity:

\`\`\`json
${raw}
\`\`\`

Source drift against its frozen runtime: ${JSON.stringify(fresh.drift)}. Native input hashes, pinned legal-packet hashes and committed witness/deliberation output checks are reported separately from raw HTTP hashes. Token totals are provider-reported known lower bounds; dollar cost is unknown. Earlier provider 529/control failures remain preserved in historical evidence and were not relabelled as successful trials.

Fresh final ballots that differ from their initial ballot: **${changed}**. Additional independent review checked all three changed final ballots against their actual initial ballot and referenced event. Morgan juror03 points to its own earlier reconsideration of the exclusive-attribution limit; Morgan juror09 points to juror04's actual source-limit contribution. Conflicting-witnesses-1 juror11 points to its own actual contradiction/doubt discussion. Their stated reasons match visible contributions and retain the current charge ID, with wording risks around corroboration and the characterization of the conflicting accounts. This establishes observed live changes with supported reasons in these requests, not clean full-trial quality or controlled mid-deliberation instruction changes. See \`changed-ballot-review.json\`.

## Next work

1. Close the remaining verifier gap around invented prior jury arguments and verify source-purpose claims against the actor-approved ledger. Require concrete support for a claimed prior contribution and preserve hypothetical challenges as hypothetical.
2. Run held-out paraphrases, legitimate opposing interpretations and multi-witness fixtures. Re-run the full persisted matrix on the latest runtime, with source/format/independent quality scored separately; targeted repairs alone cannot establish pass^3.
3. Then add restrictions and charge updates during deliberation plus controlled changed-vote fixtures. The current before-jury exclusions and three observed ballot changes do not establish responses to mid-deliberation charge updates.

Supporting files: \`evidence-summary.json\`, \`patched-evidence-summary.json\`, \`independent-review.json\`, \`patched-independent-review.json\`, \`targeted-repair-summary.json\`, and \`final-validation.json\`.
`
await writeFile('docs/qa/jury/full-trial-results.md',text)
console.log('Wrote final full-trial report.')
