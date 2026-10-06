# Opening verifier correction and live evaluation — October 3, 2026

The user authorized ECC TDD correction and fresh fictional MiniMax testing, with no further spending approval. The task was implemented and evaluated. Targeted live rejection now works for the captured unsupported participation/pleading claim, invented elements, court-record completeness and unsupported future-proof promise. The supported disputed-account control remains accepted. This is a narrow development-data result; residual attribution and legal-foundation issues remain.

## Changes and TDD evidence

`MiniMaxClient.reviewGrounding` now supplies the checker only the approved issue labels, explicit approved-party-position line and pinned legal packet from the caller's packet. It excludes private theory, prior generated turns and repair prose. The approved labels remain setup context, not evidence. The opening audit tells the checker to compare scenario elements against the pinned packet, distinguish supplied scope from the complete court record, and require actual supplied support for party positions and promised evidence.

The first correction still failed one live challenge: MiniMax classified accused participation and pleaded status as analysis. That failed candidate was preserved rather than silently repeated. A second TDD cycle placed the premise rule in the checker system message, scoped explicitly to courtroom Crown openings. Claiming that a party holds a factual position itself requires support; it is not excused as a conditional argument. The general source parser, author generation contract, original notice fixture, thresholds and opt-in behavior did not change.

| Stage | Evidence | Result |
| --- | --- | --- |
| Context regressions RED | `tmp/qa/courtroom/verifier-red.log`, `d6ef9bf` | 3 new failures / 7 existing passes |
| Context correction GREEN | `tmp/qa/courtroom/verifier-green.log`, `e210e66` | 26 focused tests pass |
| First live challenge | plan `d2d99ade75bbdb9454eace0cfca535dc09bfb8acb7749ecf76cb60e9e819cab4` | 4/5 expected outcomes; participation false acceptance persists |
| System-priority RED | `tmp/qa/courtroom/verifier-system-red.log`, `d08aa2f` | 1 intended new failure / 9 passes |
| System-priority GREEN | `tmp/qa/courtroom/verifier-system-green.log`, `48847a3` | 26 focused tests pass |

The offline tests prove the actual outbound context, priority, privacy boundary and continued positive-control application behavior. They do not by themselves prove semantic accuracy. The separate QA script `scripts/evaluate-opening-verifier.ts` freezes five checker cases, verifies candidate hashes, and uses the existing durable HTTP capture without substituting scripted actors into the original pilot. It captures each case before/after execution, preserves unexecuted cases on stop, and retains raw responses and format corrections.

The checkout already contained extensive uncommitted implementation. Checkpoints preserve the touched grounding baseline and necessary checker integration; they are not standalone releases. Existing unrelated work remains present. The tested candidate is the mixed worktree described by the frozen source hashes, not HEAD alone.

## Final frozen candidate

- Checkpoint HEAD after GREEN: `48847a3`.
- Fresh original-pilot plan SHA-256: `9c6964464cb422cc434538aedccbbbe31e423c3f8931a7326f51a599097f8fae`.
- Final checker-challenge plan SHA-256: `87d6e9c545202e5f33e05fe32fc0085eb44bb4b52f862bd136eb1d3cb2af8d75`.
- Author input hash unchanged: `a68cb80ba3b6b14d087fde4583f7c922afb5b3654a4b5db6e405851ab2c52161`.
- Original fixture hash unchanged: `5a6288975a672139f0c5446eac3c25501995e3ca63e397264774e8819c22e21b`.
- `server/minimax.ts`: `c6e0a2a4697cdb0db03ab1efa0aeb87887cb39f4f66e4a2fd4bf64844fe9e5f5`.
- `server/grounding.ts`: `6e0d3e270cfb048e56fd65e4e94fa2577b992062b006e9c2d6511f154eeaa279`.

No source changes occurred during either frozen evaluation. Both use MiniMax-M3, temperature 0, medium reasoning, max output 16,000 and 120-second request timeout. The original pilot retains three identical notice tasks, 24 HTTP / 2M input characters / 12-minute aggregate ceiling / existing one shared outer retry. The checker challenge has five predeclared cases, 10 HTTP / 2M characters / 10 minutes, at most one format correction per case. No automatic hearing, tuning within a run, fallback provider or extra cases.

The original pilot preparer's legacy text still says approval is pending. Execution was authorized by the user's current messages; the correct frozen hash was passed and candidate identity was checked. That stale descriptive text did not trigger another approval request or waive identity checks.

## Live results

| Evaluation | Actual calls | Reported tokens | Input characters | Elapsed | Outcome |
| --- | --- | --- | --- | --- | --- |
| Initial checker candidate | 5 | 12,049 | 37,694 | 60,310 ms | 4/5 expected; preserve false acceptance |
| Final checker candidate | 5 | 13,989 | 44,719 | 74,938 ms | 5/5 expected, no format retry |
| Fresh author pilot | 6 | 34,935 | 69,661 | 273,846 ms | 3/3 automated first-author acceptance |

Total this correction task: **16 provider calls, 60,973 reported tokens**. Actual account charges are unknown; the user's Token Plan was reported by the user, not inspected. No dollar estimate is presented as billed cost.

Final checker outcomes: unsupported participation plus pleaded status **rejected**; invented three-element charge **rejected**; only-exhibit-before-the-court claim **rejected**; unsupported promise to meet the burden through future evidence **rejected**; correctly attributed disputed Mira account **accepted**. These are known development challenges, not holdouts or statistical reliability estimates.

Fresh author pilot: each of the three attempts returned a useful notice account accepted on its first author draft. No author repair, withholding, timeout or transport error. No checker-format correction. Every response retained the notice-only boundary and avoided the earlier affirmative accused-participation allegation and invented transfer/participation/mental-element list. Repair behavior was not exercised by this pilot.

## Independent AI assessment of fresh openings

1. **Attempt 1:** Correct notice-purpose discussion, supplied issue and actual element ID. It does not assert participation or invent a charge-element list. However, “the legal consequences the Crown will later assert” assumes an unsupplied later assertion. “Anything the Crown suggests it will prove later is a forecast” risks sounding like permission to preview evidence absent from the approved plan. “The only uploaded exhibit” should consistently be narrowed to this actor's permitted supplied record. These remain qualifications to first-response faithfulness.
2. **Attempt 2:** Correct source-use restriction and explicit acknowledgement that no promised later evidence is supplied. It does not invent particulars. However, it attributes to the Defence a position that the Crown has not proven the case, although that actual opening/approved party position was not supplied. The statement is part of a conditional burden discussion, but the attribution is still assumed. Its phrase “every element of issue-1-element-1” also conflates the issue with its placeholder element. The checker accepted this; party-position attribution is therefore not generally solved.
3. **Attempt 3:** Strongest response: recognizes that the pinned element is a fictional placeholder with no applicable law; limits E-001 to notice; avoids transaction/participation particulars; makes later-evidence discussion explicitly conditional. Its asserted legal requirement for a three-part opening is not established by the supplied legal packet. This is a separate legal-foundation qualification, not a supported governing instruction.

The targeted checker challenge passed; **a clean substantive three-opening progression pass is not established**. Automated acceptance and useful notice prose are not sufficient to erase these independent qualifications. AI review is not qualified human legal review. Qualified-human identity, findings and attestation fields remain blank. The [derived scoring worksheet](verifier-correction-scoring.csv) keeps all three attempts and unexecuted repair rows separately.

## Verification and remaining work

- `npx vitest run tests/crownOpeningFaithfulness.test.ts tests/grounding.test.ts tests/pilotEvidence.test.ts`: 26 pass after each correction.
- `npm run build`: pass; `npm run typecheck`: pass; `npm run lint`: pass.
- Dedicated TypeScript check for both evaluation scripts: pass.
- `npm run coverage:all`: 205 tests / 35 files, pass. Final aggregate statements 84.20%, branches 80.19%, functions 83.43%, lines 85.14%; no threshold or exclusion changes. Initial unit-only coverage is not the aggregate gate.
- `npm run test:sim`: 14 scripted checks pass. Its existing “live” wording refers to an injected scripted client, not a provider-quality result.
- `npm run eval:courtroom`: 30/30 scripted scenario attempts pass, no provider calls.
- `npm audit --json`: zero vulnerabilities. Known credential-pattern filename scan on changed code: no matches. Diff whitespace check passed. All 16 raw request/response hash pairs were recomputed and matched their journals; the final candidate source manifest had zero drift after execution.

The requested verifier correction and fresh evaluation are complete. The remaining narrow issue is unsupported attribution to either party and unsupplied legal/procedural assertions in otherwise useful prose. Future tests should address those exact retained units, include paraphrases beyond these development examples, and retain supported accounts. The full visible-browser hearing was not started; it remains a later separately scoped test. General reliability, legal readiness and qualified approval are not claimed.

## Local raw evidence

- [Initial checker evidence](../../../tmp/qa/courtroom/crown-opening/verifier-live-d2d99ade75bbdb9454eace0cfca535dc09bfb8acb7749ecf76cb60e9e819cab4-1791042985234/results.json).
- [Final checker evidence](../../../tmp/qa/courtroom/crown-opening/verifier-live-87d6e9c545202e5f33e05fe32fc0085eb44bb4b52f862bd136eb1d3cb2af8d75-1791043201151/results.json).
- [Fresh author evidence](../../../tmp/qa/courtroom/crown-opening/live-9c6964464cb422cc434538aedccbbbe31e423c3f8931a7326f51a599097f8fae-1791043212690/pilot.json).

Each run has its approved input/settings, exact application request bodies, raw application-visible response bytes, hashes, journals, reported usage and parsed derivatives. Headers/credentials are not serialized. All raw synthetic artifacts remain ignored and local; the report and worksheet are derived assessments.
