# Jury argument and source-boundary repair

Updated 2026-10-05. Fictional fixtures only; MiniMax-M3. No real-case data, default-provider change, deployment, or actual-law certification.

## Implemented

- Claims about prior juror arguments require matching visible contribution records. Preserve polarity, actual actor identity, and verbatim quotations. Multi-sentence quotations stay in one attribution unit.
- Actual visible Crown and Defence submissions can support attribution of their public statements. They do not establish evidence truth, cannot expose private submissions, and cannot exempt a separate source assertion in the same unit.
- Preserve permission to assess admitted disputed accounts. Do not turn that permission into an exclusive-attribution restriction or invented categorical legal insufficiency.
- Preserve observer versus observed person, receipt knowledge versus receipt denial/non-observation, departure versus continuous possession, unknown versus non-primary classification, and complete source summaries.
- The challenge phase permits agreement and clarification when no contrary point was raised. It requires accurate reference to an actual contribution or an explicit hypothetical.
- Author instructions use exact relevant approved-source sentences for observer and knowledge summaries, including rationale and vote-change reasons.
- Provider overload recovery retries the identical HTTP body for checker and author requests within the configured retry count. It does not regenerate an accepted draft merely to retry its checker.

## Local validation

`RUN_BROWSER_COVERAGE=1 BROWSER_COVERAGE=1 npx vitest run --coverage --maxWorkers=1`: **317 tests, 49 files passed**, including browser journeys. `npm run build`, `npm run lint`, and scoped `git diff --check` passed.

`npx tsx scripts/merge-browser-coverage.ts`: statements **84.80%**, branches **81.97%**, functions **84.39%**, lines **85.59%**. Every category exceeds the ECC 80% gate.

Draft statistics distinguish accepted first received author responses from source-repair flags. Successful author HTTP responses count as received drafts; repeated non-success HTTP retries do not. Multiple successful author responses within an accepted actor request count as regeneration, including source, format, or transport-triggered regeneration. The old flag is retained as `sourceRepairFlagFirstAccepted`, not presented as first-draft acceptance.

One earlier suite had a browser click timeout and 311 passing tests. Its failure is retained in `tmp/qa/jury-ledger-presence-full.log`; later complete suites passed. RED regressions and intermediate failed live candidates remain preserved, rather than being relabelled as successes.

## Completed 14-trial matrix

Frozen plan: `95b429ae6fd777c1a8abce87d2d96a67c966d3216c89db6445ca32622023c892`, runtime `tmp/qa/jury-ledger-matrix`. This snapshot predates the final public-concession, mixed-claim, observer-wording, and transport follow-ups.

All **80 controls matched**. All **14 attempted trials reached terminal results**; **7/14 passed every mechanical check**. Both full-hearing attempts aborted after provider overload. Other failures include missing valid ballots/deliberation requests and two source-verification rejections, including an accurate public concession that lacked a supported record-citation mechanism in this old snapshot.

Whole-trial quality gate: **11 trials independently rejected**, **3 incomplete**, **0 full independent passes established**. A rejected trial requires a material accepted-response defect; an incomplete trial cannot pass merely because a reviewed subset is accurate. See `ledger-matrix-independent-review.json` for specific fields and review coverage. A mechanical pass does not imply source-faithful legal prose.

Raw audit: **2,113 received exchanges**, **84 HTTP 529 responses**, **1 failed exchange**, **0 incomplete exchanges**, **0 request/response hash mismatches**. The **765 native context manifests** had no actor-input, context-manifest, legal-packet, or committed-output mismatches. Known reported token usage is **21,219,637**, a lower bound; monetary cost is unavailable. Frozen source drift is zero. See `ledger-matrix-evidence-summary.json`. A later received-draft recount accounts for all 758 accepted responses: 640 accepted first received author responses and 118 accepted regenerated responses, compared with 647 under the old source-repair flag. `ledger-matrix-received-draft-audit.json` preserves that recount and keeps the two earlier stopped source snapshots separate; their drift is not assigned to the completed 95b429 candidate.

Two earlier matrix attempts stopped during controls with zero actor inputs. Their interruption receipts are retained and are not counted as completed trials.

## Latest targeted candidate

Plan `06e332d5405583cba060123947a7b5d1c54d67589e7f9dff0f8f83b2af0bec34` retains the actual failed matrix replies, exact permitted sources/events, a valid public-concession positive control, and a protocol-updated fresh reply. All **14/14 expected outcomes** matched (13 controls plus the original reply checked before regeneration). The fresh reply independently passed with wording risks: exact receipt-uncertainty quotation, actual Crown concession, current instruction and own initial ballot preserved; no invented contrary argument or observer substitution. Receipt-scoped sole-account wording must not be read as denying the separate presence observation.

This latest run retained **20 received exchanges**, **0 HTTP errors**, **0 failed/incomplete exchanges**, and **0 hash mismatches**. Known reported token usage: **191,888**, a lower bound.

`ledger-independent-review.json` and `ledger-repair-summary.json` preserve each candidate separately, including false positives, provider errors, independently failed replies, repairs, and successful reviewed replies. Protocol-updated replays are distinguished from unchanged original requests.

## Full-hearing recovery

The first recovery candidate `758993e800a496c70588562cac1d8af54fce14e337593fc67717d830e66d2352` stopped at 79/80 controls, with no actors, due to missing Crown-role fixture metadata. Candidate `03b509f0f2be64bc4ed4a4ea16b67ce2623c43ae1dedf6471a0774e015bde1ff` stopped at 78/80 controls, with no actors: an ambiguous missing-observation fixture and an unrecognized expressly rejected Defence attribution. Both failures are retained. The role metadata and fixture wording were corrected, and a RED/GREEN regression now covers actual and wrong-party rejection attributions. Latest frozen plan `432144a557fdb1a4a52c30a325d45467dba4142eee145fc8c3a599f7d9c8bef6` in `tmp/qa/jury-ledger-final-v3` completed both full fictional hearing workflows. All **80/80 controls matched**, and **162/162 actor requests finished**. Each hearing passed 18 of 20 mechanical checks, but **0/2 passed every check**: ballot validity and changed-vote reasons failed. Each had **23/24 valid ballots**, including only 11 valid final ballots. Both persisted incomplete `no_verdict` decision sheets; terminal workflow completion does not establish a complete jury decision. **0/2 independent source-quality passes were established**.

Morgan actor 72 selected a limiting-instruction event where the structured change contract requires a deliberation turn. Rowan actor 76 selected a valid deliberation turn, but its per-juror citations were empty despite verified source quotations and a top-level citation. Native sourceRefs were consequently empty. These are different causal-link failures; the existing validity guard correctly withheld both ballots.

Final raw audit: **509 received exchanges**, **18 HTTP 529 responses**, **1 failed exchange** (checker AbortError, subsequently recovered through author regeneration), **0 incomplete exchanges**, and **0 request/response hash mismatches**. All **18/18 overload responses were followed by identical request bodies**. The **158 native manifests** had zero input, manifest, legal-packet, or compared committed-text mismatches. The committed-text comparison covers witness answers and jury contributions; ballot metadata is checked separately. Frozen source drift is zero. Known reported usage is **5,579,896 tokens**, a lower bound; cost is unknown. Of 162 accepted actor requests, **137 accepted the first received author draft** and **25 accepted regenerated drafts**. See `ledger-recovery-evidence-summary.json`, `ledger-recovery-transport-audit.json`, and `ledger-recovery-independent-review.json`.

## Next gate

Independent review rejected Rowan actor 25 for using attribution-only material as receipt proof, Rowan actor 75 for inventing a receipt-purpose carve-out, and Morgan actor 24 for inventing assessment permission. Verdict preference is not a success criterion. Morgan actor 14's exhaustion wording was reclassified as a wording risk: in context it may describe counsel's assessment that the recorded points were covered and does not expressly prohibit further inquiry.

Next, use ECC TDD to validate the event-plus-source contract before committing changed ballots and to propagate only verified citations belonging to the same juror's units, recording any metadata correction. Preserve the native validity guard. Strengthen proof-use verification against the actual supplied permission, pairing erroneous adoption of a peer's argument with accurate historical reporting of that argument as a positive control. Preserve genuinely assessment-permitted disputed evidence and counsel completion assessments; do not add a blanket corroboration requirement or exhaustion-word ban.

Run captured controls and fresh regenerations, independently review them, then freeze and rerun both full hearings and the four prepared-record scenario families across three seeds. Details are in `next-proof-use.md`. The current repairs and targeted successes do not establish universal natural-language faithfulness or readiness for real-case use.
