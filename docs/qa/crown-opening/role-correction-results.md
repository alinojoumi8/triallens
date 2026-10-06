# Crown-opening party role correction — October 3, 2026

The two captured invented-role claims are corrected in the new candidate. Approved scenario party identities are carried into the opening request explicitly, and the author and checker treat role assignments as factual premises even within negations, disclaimers, conditional clauses and partly supported sentences. The first run exposed a separate unsupported disclosure-status claim; its failed result is retained, and a new candidate adds that correction.

## Implementation and TDD

`StageRequest.approvedPartyRoles` contains only the approved party ID, name and role. The trial engine constructs these from the approved case model; it does not infer an accused identity from a name appearing in an exhibit. The author and independent opening checker serialize only those three fields, excluding representation/source/private metadata. Missing mappings are explicitly empty. Permitted evidence can still identify a witness or a giver/recipient; scenario role metadata establishes identity, not conduct or guilt.

The checker examines every factual clause, including the number of accused and handover direction. A matching handover quote cannot rescue an invented accused-role clause. A disclaimer of guilt does not remove an asserted role. Unknown contents or knowledge warrant missing-support findings; they do not prove the opposite underlying event.

ECC RED: `npx vitest run tests/openingRoles.test.ts` produced four failures before production changes; checkpoint `4ffa011`. GREEN: `npx vitest run tests/openingRoles.test.ts tests/crownOpeningFaithfulness.test.ts tests/openingAuditSetup.test.ts tests/grounding.test.ts` passed 24 tests in four files; production checkpoint `0c7a18b`. These tests verify the engine request and outbound context boundaries, not model semantic reliability. The live cases below test the latter separately. The fixture, parser, coverage thresholds and courtroom opt-in remain unchanged.

The existing checkout contains unrelated implementation changes, including the trial-engine implementation. They are preserved. Checkpoints are selective; the tested candidate is the mixed worktree identified by the frozen source manifest, not HEAD alone. The new request wiring in `server/trialEngine.ts` remains within that mixed worktree.

## Frozen live allocation

Plan SHA-256: `1bfbe78ec1f4ab8b0cfc7a6fced229fedbd5034c0c7959f60e3dc301834902af`. Case factory: `samples/courtroom-realism/opening-role-evaluation.ts`; runner: `scripts/evaluate-opening-roles.ts`; evaluation checkpoint `c6b83ef`.

Thirteen checker cases comprise eight negatives and five positives. The negatives include both exact captured false acceptances, a negated role, a conditional role, a mixed complainant claim, an invented second accused, reversed handover direction, and an attempt to treat approved identity as proof of knowing cash receipt. The positives include the neutral attributed account, a generic conditional burden statement, Mira's source-supplied witness role, and expressly supplied accused identities for Ellis and Rowan.

Four fresh authors use the unchanged disputed account: twice without party identity, once with Ellis designated accused, and once with Rowan designated accused. They are development examples and repetitions, not unseen holdouts. No actual law or real case is tested.

MiniMax-M3, temperature 0, medium reasoning, 16,000 output allowance, 120-second request timeout, maxRetries 1. Aggregate ceilings: 48 HTTP calls, 3M input characters and 15 minutes. These are experimental limits, not spending approval gates. The user authorized fictional MiniMax testing without further spending approval. Each declared case runs once despite substantive rejection; cancellation/transport/capture/deadline failure stops the run and retains unexecuted cases. The candidate is unchanged within the run.

Predeclared success requires all eight negatives substantively rejected, all five positives accepted, all four final authored outputs independently source-faithful and useful, and at least three first author responses accepted. Automated acceptance alone does not establish success. The original broader failed result remains intact. No full hearing is automatically started.

## Software verification

- `npm run coverage:all`: first candidate 212 tests and corrected candidate 214 tests, each in 37 files, passed; combined statements 84.22%, branches 80.21%, functions 83.49%, lines 85.15% for both. Thresholds/exclusions unchanged; the combined report is the gate.
- `npm run build` and `npm run lint`: passed; build includes TypeScript checking.
- Dedicated script check: `npx tsc --ignoreConfig --noEmit --target ES2023 --module ESNext --moduleResolution bundler --skipLibCheck --types node scripts/evaluate-opening-roles.ts` passed. The initial invocation without `--ignoreConfig` failed with TS5112; the corrected invocation passed.
- `npm run test:sim`: 14 scripted checks passed. Its existing stdout says "live" but uses an injected scripted model.
- `npm run eval:courtroom`: 30/30 scripted cases passed, zero provider calls.
- `npm audit --json`: zero vulnerabilities. `git diff --check`: passed.

## Live results and independent AI review

The first frozen role-only run completed 17 cases with 25 HTTP calls, 107,366 reported tokens, 261,500 input characters and 529,056 ms (8 minutes 49 seconds). All 13 checker cases matched expectations with substantive findings. All four final authors were accepted and respected the role boundary, but only two passed their first response. Independent AI review found three final outputs faithful overall: author 4's repair still said "E-101 is a disclosed observational account" without any supplied disclosure-status context. Its qualification that other disclosure may exist repairs the completeness claim, not the individual item's procedural status. Strict progression failed. No transport/format failure or unexecuted case occurred. All 25 request/response hash pairs matched. See `role-initial-summary.json` and `role-initial-scoring.csv`.

Author 1's original was correctly withheld for attributing an unsupplied future trial task to the Defence. It also called Mira "the Crown's only witness," a roster-completeness premise that the checker did not separately flag. Author 4's original was withheld for calling E-101 the single disclosed observational account. The repaired author 4 was falsely accepted on the narrower but still unsupported individual disclosure-status claim. These outputs are retained; they are not counted as first-response successes.

The follow-up correction requires explicit status support for disclosed/filed/admitted/sworn/authenticated claims and explicit roster support for "only witness." It preserves supplied statuses and limited admission purposes. The author also receives a compact, ordinary-language opening instruction. ECC RED: the two new outbound status tests failed (four role tests still passed), checkpoint `a0dea69`; GREEN: all 26 focused tests passed, production checkpoint `f258d94`.

The second plan is `530e7e571a241d3ec8124cc91abf4312c1e69b50ced2bea59604c14966f213d2`, evaluation checkpoint `37887ba`. It retains the first 13 checker controls, adds five unsupported status/roster examples and two explicit positive status controls (20 checker cases total: 13 negative, seven positive), then runs four fresh authors with the same source/role allocation. Success still requires all expected checker decisions, all four independently faithful useful finals and at least three first-response acceptances. Runtime/provider/method limits remain as above. This is a new changed candidate, not a tuned retry within the earlier frozen run.

The corrected run completed all 24 cases and met its predeclared opening criteria. Command: `npx tsx scripts/evaluate-opening-roles.ts --live --approved-plan-hash=530e7e571a241d3ec8124cc91abf4312c1e69b50ced2bea59604c14966f213d2`; exit 0.

| Component | Corrected candidate result |
| --- | --- |
| Negative checker examples | 13/13 rejected for substantive unsupported/contradicted findings, with no format-validation errors |
| Positive controls | 7/7 accepted |
| First author response, automated | 3/4 accepted |
| Author repairs | One, accepted |
| Final authors, automated | 4/4 accepted |
| Final authors, independent AI source review | 4/4 faithful and useful for the supplied fictional record |
| Predeclared opening success rule | Passed |

Actual usage: **30 HTTP calls, 115,488 provider-reported tokens, 334,949 input characters, 455,446 ms (7 minutes 35 seconds)**. All 30 request/response hash pairs matched their journals. All frozen candidate source hashes still matched after execution. No timeout, transport/capture failure, cancellation or unexecuted case occurred. No checker-format correction was required. Across both candidates this task used **55 HTTP calls and 222,854 reported tokens**; the first failed candidate's usage is retained, not discarded. Actual account charges were not inspected.

| Fresh opening | Original / repair | Independent final assessment |
| --- | --- | --- |
| role-author-1, no supplied accused identity | Original accepted | Attributed disputed account; unknown contents; no invented legal role or source procedural status |
| role-author-2, no supplied accused identity | Original accepted | Names giver/recipient while keeping conduct, contents and guilt qualified; no invented accused identity |
| role-author-3, Ellis supplied as accused | Original accepted | Role metadata does not become conduct/guilt proof; account remains attributed and source limits remain explicit |
| role-author-4, Rowan supplied as accused | Original withheld; repair accepted | Removed court-record scope claim; final compact disputed account adds no invented identity/status or promised evidence |

Author 4's original said "Beyond that observation, the proof is not before the court." The checker flagged the unsupported court-record scope and two missing verified-source citations. The author repair is not counted as a first-response success. The final account is explicitly disputed and confined to the permitted source record. The wrong-direction negative was contradicted by the witness's actual reported account; unsupported cash/knowledge/status/roster examples were rejected for missing support. No inference that unknown contents are empty, or that unknown knowledge is absent, is established.

These are small, predeclared development cases, with familiar failures and paraphrases, not a statistically established reliability estimate. The reviews concern factual/source-use faithfulness and proportional usefulness. Generic burden language in author 2 was not validated as governing law; the direct account fixtures do not supply a complete legal packet. Legal correctness, persuasion quality and full-hearing performance remain separate evaluations. See `role-final-summary.json` and `role-final-scoring.csv`; human-review fields remain blank.

## Decision and next work

The requested role correction and the newly exposed source-status correction are implemented and evaluated. Both captured role false acceptances and the captured disclosure-status false acceptance are now rejected, while supplied-role and supplied-status controls remain accepted. The earlier failed results remain preserved. No full hearing, real-case processing, publication or default-enablement occurred.

The next step is a separately scoped fictional hearing evaluation covering Defence openings, examination, objections and closings, with complete approved role/legal/source-status setup and review of each stage's permitted record. This opening result supports preparing that evaluation; it does not certify all later stages or legal readiness. Fictional MiniMax testing remains authorized without another spending approval.

## Raw evidence

First candidate: `tmp/qa/courtroom/crown-opening/role-live-1bfbe78ec1f4ab8b0cfc7a6fced229fedbd5034c0c7959f60e3dc301834902af-1791055981104`.

Corrected candidate: `tmp/qa/courtroom/crown-opening/role-live-530e7e571a241d3ec8124cc91abf4312c1e69b50ced2bea59604c14966f213d2-1791056758630`.

Each includes its immutable approved plan, results journal and individual HTTP exchange folders with exact serialized request bodies, application-visible raw response bytes, hashes, timestamps, usage and case/original/repair links. No credential headers are retained. The original notice fixture remains SHA-256 `5a6288975a672139f0c5446eac3c25501995e3ca63e397264774e8819c22e21b`. Raw fictional evidence remains local and ignored; this report and the worksheets are derived assessments.

TencentDB trial receipt `552ad06757f3964dd434ad8dabb19cb087179a723303dace6991eb21731fd21b` was queried: terminal `processed`, `stored_count: 9`, `failed_attempts: 0`. This confirms extraction ran; the resulting memory remains untrusted agent-report material. The local report is the verified project record. A filename-only scan for the selected API-key/JWT patterns in the new tests, runner, case factory and report found no matches.

The review is Codex AI assessment of fictional source faithfulness. Qualified human legal review remains unperformed; identity/attestation fields in the worksheet remain blank. Reliable source handling across the entire hearing and legal readiness are not established by these opening-only examples.
