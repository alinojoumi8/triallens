# Remaining opening corrections and broader live evaluation — October 3, 2026

The user authorized finishing the remaining grounding corrections and broader fictional MiniMax evaluation, without another spending approval. The three targeted corrections were implemented and the predefined run completed. All 24 checker cases produced the expected decisions. All six authored openings were eventually accepted, but independent AI review found two false acceptances involving unsupplied accused roles. The strict progression rule did not pass; the complete hearing was not started.

## Implementation and TDD

`openingAuditSetup` extracts explicitly labelled issue lists, party positions, pinned legal packets, scenario procedure instructions and evidence plans from the caller's packet. Missing categories are empty arrays. Private advocacy and generated-text fields in the boundary tests are not promoted to approved context. This is a labelled-field extraction boundary for the supplied packet, not a general guarantee against adversarial packet formatting.

The opening checker now applies party-position support equally to both sides, including a Defence position embedded within an if-clause. It requires supplied support for mandatory procedural rules and future legal assertions. It preserves recommendations, genuinely conditional reasoning, attributed disputed accounts and expressly supplied fictional rules/plans. The author opening contract was also aligned with these requirements. The source parser, original notice fixture, coverage thresholds and opt-in behavior were unchanged.

ECC RED: `tests/openingAuditSetup.test.ts` executed three failures for the missing setup extractor; log `tmp/qa/courtroom/broader-red.log`; checkpoint `48cd296`. GREEN: 29 focused tests in four files pass, including existing source/transport regressions and supported account controls; log `tmp/qa/courtroom/broader-green.log`; checkpoint `b512ef3`. These tests establish the extraction and application boundaries; live semantic results are reported separately below.

The new development-case factory is `samples/courtroom-realism/opening-evaluation.ts`; the QA runner is `scripts/evaluate-opening-broader.ts`. It freezes actual inputs, expected outcomes, source hashes, allocation and limits before calling the provider, journals each started/finished/withheld/unexecuted case, and uses the existing durable HTTP transport. No prompt or source changes occurred during execution. Existing unrelated dirty work remains preserved; the source manifest identifies the tested mixed worktree, not HEAD alone.

## Frozen allocation and candidate

- Plan SHA-256: `52be31578cd957b78154af34bbb5575b06b31048bd0dbc26456486f4e9a94dd5`.
- Implementation checkpoint: `b512ef3`.
- `server/minimax.ts`: `c4aca96eedd76b043268155c2a021263eae9a5b94761def16ef40ecb712c6c33`.
- `server/grounding.ts`: `086356b8bece4d29be0605f528294d7ce912382f4490d34bccb4b390e6289fc9`.
- Original notice fixture unchanged: `5a6288975a672139f0c5446eac3c25501995e3ca63e397264774e8819c22e21b`.

Twenty-four checker cases: three variants each of unsupported Defence positions, invented procedural law, unsupported future assertions, scope/purpose overreach and invented witness accounts (15 negatives); three notice controls, three disputed-account controls and three explicit setup controls (9 positives). Six fresh author requests: two repetitions each of notice, disputed-account and expressly supplied fictional setup records. These are authored development examples and paraphrases, not holdouts.

MiniMax-M3, temperature 0, medium reasoning, 16,000 output allowance, 120-second request timeout, existing maxRetries 1. Aggregate ceilings: 84 actual HTTP requests, 3M serialized input characters and 20 minutes. These are methodological limits, not a monetary cap. All cases execute once despite substantive rejection; stop for aggregate/cancellation/capture/transport failure, retaining remaining unexecuted cases. No hidden fallback, tuning within the run or repeated attempts until green.

Predeclared success: all 15 negatives rejected, all 9 positive controls accepted, all 6 final authored outputs independently source-faithful and useful, with at least 4 passing the first author response. Automated acceptance alone does not establish progression. Qualified human legal review remains separate.

## Live results

Command: `npx tsx scripts/evaluate-opening-broader.ts --live --approved-plan-hash=52be31578cd957b78154af34bbb5575b06b31048bd0dbc26456486f4e9a94dd5`; exit 0. All 30 declared cases finished. No transport error, timeout, cancellation, resource stop, withheld final author output or unexecuted case.

Actual usage: **42 HTTP calls, 183,536 provider-reported tokens, 558,360 serialized input characters, 867,157 ms (14 minutes 27 seconds)**. Actual account charges remain unknown; the user reported a Token Plan. All 42 request/response hash pairs were recomputed and matched their journals. Candidate source drift after execution: zero.

| Component | Result |
| --- | --- |
| Negative checker cases | 15/15 withheld for substantive unsupported/contradicted findings, not format failures |
| Positive checker controls | 9/9 accepted |
| First author response, automated | 4/6 accepted |
| Author repair | 2 required; both eventually accepted |
| Final author output, automated | 6/6 accepted |
| Final author output, independent AI review | 4/6 faithful to supplied record; 2 retain invented roles |
| Strict progression rule | Failed |

Two checker findings use “contradicted” for invented envelope-content/knowledge accounts. Correct withholding must not be interpreted as proof that the envelope contained no money or that a transferor lacked knowledge. The source records the witness's uncertainty; contradiction must be confined to misrepresenting her account, not assumed as proof of the opposite underlying event. This finding-label precision remains a limitation.

## Fresh openings: independent AI review

| Case | First response | Repair | Independent final assessment |
| --- | --- | --- | --- |
| author-record-1-1 | Rejected: invented transfer/participation allegation and only-exhibit-before-court claim | Accepted after one author repair and one checker-format correction | Pass for supplied-record faithfulness; notice-only roadmap and proof gaps retained |
| author-record-1-2 | Rejected: overbroad only-exhibit-before-court claim | Accepted after one author repair | Pass for supplied-record faithfulness; recognizes placeholder elements and avoids promised testimony |
| author-record-2-1 | Accepted | None | Fail: calls Rowan and Ellis “either accused” without supplied accused-role mapping |
| author-record-2-2 | Accepted | None | Fail: presupposes “the accused's role beyond the alleged receipt” without identifying any supplied accused or accused-recipient mapping |
| author-record-3-1 | Accepted | None | Pass: supplied Defence position, fictional handover condition and Mira-questioning plan accurately used |
| author-record-3-2 | Accepted, after one checker-format correction | No author repair | Pass: supplied disputed account, fictional standard and plan retained; no invented contents or additional evidence |

Both notice originals failed. Repairs are not counted as first-response successes. The two other first-response acceptances with invented roles likewise do not become substantive successes merely because the verifier accepted them. Only the two supplied-setup openings passed independently on their original responses.

Exact false acceptance, disputed-account case 1, checker `content:4`, analysis: “The Crown therefore opens on the basis of a claimed observation of a handover between Rowan and Ellis, and not on proof of the envelope's contents, its purpose, or any resulting guilt on the part of either accused.” The checker treated the non-assertion of guilt as positional framing and did not check the implied two-accused role assignment.

Exact false acceptance, disputed-account case 2, checker `content:9`, supported: “The Crown's roadmap is therefore this: the only supported factual proposition is the witnessed handover as described in E-101; everything else, including contents, motive, and the accused's role beyond the alleged receipt, remains unproved on this record.” The checker validated the handover clause and treated the remainder as analysis, overlooking the role/receipt premise. E-101 names a witness, giver and recipient, but the packet supplies no accused identity for either person. A correct account clause does not support every premise of a mixed sentence.

The assessment is Codex AI review using the provisional simulation rubric. The “pass” entries concern faithfulness and useful proportional prose, not governing legal correctness or legal readiness. Qualified-human identity, finding and attestation fields remain blank. The separate [derived worksheet](broader-evaluation-scoring.csv) retains every case, original failure, repair decision and independent assessment.

## Verification

- `npx vitest run tests/openingAuditSetup.test.ts tests/crownOpeningFaithfulness.test.ts tests/grounding.test.ts tests/pilotEvidence.test.ts`: 29 pass.
- `npm run build`, `npm run typecheck`, `npm run lint`: pass.
- Dedicated TypeScript check for `scripts/evaluate-opening-broader.ts`: pass.
- `npm run coverage:all`: 208 tests / 36 files; aggregate statements 84.21%, branches 80.16%, functions 83.46%, lines 85.15%. Thresholds and exclusions unchanged. Unit-only coverage is not the aggregate gate.
- `npm run test:sim`: 14 scripted checks pass; existing “live” wording refers to an injected scripted model.
- `npm run eval:courtroom`: 30/30 scripted scenarios pass, zero provider calls.
- `npm audit --json`: zero vulnerabilities. Known credential-pattern filename scan on changed code: no matches. Diff whitespace check passed.

TencentDB trial receipt `8d85b1682cdba31fea1f9c67931a570ce21cdc1b3554343b100db9e5a2c483d6` was queried and returned terminal `no_useful_memory`, `stored_count: 0`, `failed_attempts: 0`. No useful extracted memory items are confirmed; this is not an ingestion failure. The local report and evidence remain the durable project record.

## Decision and next correction

The requested three corrections and broader predefined evaluation are complete. The checker discriminates the declared negative and positive controls, but free-form openings still expose a role-attribution gap. Full-hearing progression is not established.

The next evidence-backed correction is to carry explicitly approved person/party roles into the author and checker contexts and validate role assignments in every clause, including disclaimers, negation and partly supported sentences. Do not infer accused, complainant or witness status merely from someone being named in an exhibit. Preserve genuinely supplied role mappings and useful attributed accounts as positive controls. Findings about uncertainty must not become proof of an opposite underlying event. A changed candidate needs a newly identified evaluation; this frozen result must remain intact. Current fictional MiniMax testing authorization persists.

## Raw local evidence

[Approved plan, results and individual audit records](../../../tmp/qa/courtroom/crown-opening/broader-live-52be31578cd957b78154af34bbb5575b06b31048bd0dbc26456486f4e9a94dd5-1791046765944/results.json). The same directory contains `approved-plan.json` and 42 exchange folders with exact request bodies, raw application-visible response bytes, envelope derivatives, hashes, UTC timestamps, usage and case/generation links. Original and repaired author responses remain separately retained. No authorization headers, cookies or credentials are serialized. Raw synthetic artifacts remain local and ignored; this report and the scoring worksheet are derived assessments.
