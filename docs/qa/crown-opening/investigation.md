# Crown opening investigation — October 3, 2026

This is Judge & Jury / TrialForge work in `D:\myprojects\judgeandjurry-codex`. No provider requests were made during this investigation, tuning, replay or verification. Existing data, mixed edits and opt-in behavior were preserved.

## Evidence and chronology

Baseline HEAD was `e34d5720579ca0cb7876a564a69de71f34107c2c`. There is no repository `AGENTS.md`; the chat-supplied project instructions apply. Baseline status/diff are under `tmp/qa/courtroom/opening-baseline-*`. The two historical reports remain untouched:

- `tmp/qa/courtroom/live-evaluation-2026-10-03T07-50-45-196Z.json`: timeout pilot. Crown opening was reported passed; defence opening timed out. Six HTTP calls, about 155 seconds; reported tokens unavailable. It contains no failed factual audit or raw passed Crown output, so the opening cannot be independently rescored from that report.
- `tmp/qa/courtroom/live-evaluation-2026-10-03T07-56-16-993Z.json`: Crown source-verification failure after one repair. Four HTTP calls, 18,718 reported tokens, about 107 seconds; cost unknown.

**Correction to the earlier ECC summary:** `grounding.priorFailures[0]` is the original check; top-level `grounding.findings` is the final check of the repair. The original asserted the transfer/participation. The repair introduced “only filed exhibit.” The previous follow-up reversed this order. This report uses the stored chronological structure, confirmed by the actual client loop and deterministic replay.

The source recording is `samples/courtroom-realism/opening-recording.json`, with the historical report hash and input/context hashes. Draft prose is reconstructed from exact stored sentence units. Raw response JSON, original whitespace, byte-identical outbound HTTP bodies and the original approved model/actor-input rows are unavailable: the runner used an in-memory database and closed it without exporting those rows. Do not represent reconstruction as their recovery.

`tmp/qa/courtroom/opening-baseline-reconstruction.json` records the pre-fix fixture reconstruction, approved model, private theory briefs, ledger, actor projection, StageRequest and intercepted outbound body. Random IDs/timestamps differ from the historical run. The reconstructed pinned legal packet hash matches the historical hash. Historical input hash: `a6653f8730e54a6d8cce975260d9389708f72a53a11ea502c53eb50f4c0eedea`; context hash: `21ab636c11f34747c29cd2267d037e7a15ae870a59f8662aba666aac871eb579`; projection hash: `3d1f1b562f2d4c5412a43bed65f91f34230394ccb7cbec3ecde669652b6d161a` (consult the original report for the authoritative full value).

## Claim-by-claim trace

The original fixture remains unchanged. Visible E-001 paragraph 1 says exactly **“Early material fact: notice was delivered.”** Its ledger allows **“Notice only; not proof of truth.”** E-002 is excluded. The Crown's theory narrative is a fictional privacy marker, with no substantive supporting claim. The approved issue label is “Fictional disputed transfer”; the legal packet names the responding party `accused-1` and has a fictional placeholder element. None supplies an account of a transfer or this person's participation.

| Disputed claim | Source / purpose and input provenance | Original check | Repair and final check | Finding |
| --- | --- | --- | --- | --- |
| “The Crown's position, to be tested through evidence you will hear, is that a transfer occurred and that the accused was a party to it.” — transfer component | No citation in the sentence. Only visible notice source cannot establish a transfer. “Disputed transfer” is present as an issue label; the asserted occurrence is not in the reconstructed permitted source or approved party position. | Unsupported: framing as a Crown position does not supply a supported factual premise. | “The Crown will contend, through evidence to be called, that a transfer occurred and that the accused was a party to it.” The final checker labels this **analysis**, as forward-looking contention. | Generation error and repair retention of an unsupported premise. Checker judgments are inconsistent; semantic false acceptance of this component is observed, although the whole repair was withheld for another claim. |
| Same original sentence — accused participation component | No supporting source. `accused-1` is a procedural party ID; it does not establish involvement. No witness account or approved position states participation. | Unsupported together with the transfer component. | Same repaired future-contention sentence; accepted as analysis. | The actor expands party/issue metadata into an unsupported proposition. Attribution alone is not a cure. Exact historical input contamination remains unprovable because outbound bytes were not retained. |
| “The Crown's only filed exhibit at this point is E-001 (notice.txt).” | Notice source does not describe filing/disclosure completeness. The projection contains one visible exhibit, but this says nothing about every filed exhibit. The record-coverage warning explicitly disclaims that inference. | **Not the original assertion.** Original says “The single exhibit presently supplied to the Crown as part of the trial record is E-001…”; accepted as a statement scoped to supplied material. | Repair changes supplied scope to **only filed**. Final checker rejects unsupported exclusivity. | New repair error. Rejection is consistent with the existing coverage rule; no transport failure caused it. |

## Confirmed cause and limits

The source is clean; the fixture carries no transaction or participation account. The captured pre-fix outbound prompt nevertheless calls the case packet “relevant evidence” and asks the Crown to present chronology, corroboration and loss theory. These are conflicting instructions for a sparse fixture whose issue label is only a question. This prompt conflict is confirmed. It is a plausible contributor to the observed expansion, not proof of the model's internal cause.

The repair changes an already valid scoped record description into a filing-completeness claim. The semantic checker also treats nearly equivalent transaction content differently between drafts. A separate earlier defence timeout is transport evidence, not a source-faithfulness result. There is no evidence that the restricted source itself was modified or that an excluded witness account leaked into the reconstructed Crown request.

## Narrow correction and contract

Only `MiniMaxClient.requestBody` changes production behavior, and only for `courtroom_v1` Crown openings. It distinguishes metadata/private advocacy from source evidence, replaces the generic chronology/loss role and stage focus with a source-supported roadmap, permits discussion of a notice source in a criminal scenario, and states a four-category opening contract that remains present on repair:

1. Explicitly supplied approved allegation or party position: attributed, never invented, and separate from proof.
2. Source-grounded preview: accurately identify a supplied account, its expected use and qualification; no invented later testimony.
3. Evidence-based assertion or qualified inference: actual supporting passage plus purpose/audience restrictions.
4. Unknown or unsupported proposition: state the supplied-record limit without inventing facts or filing/disclosure completeness.

The contract rechecks final prose for new implications. It does not turn every opening sentence into testimony. No additional claim-planning model call was justified: existing source projections and statement/ref structures already supply the necessary boundaries. Source verification, repair logic, scoped projection, ballot recovery, import integrity and archive behavior are unchanged.

This is a proposed simulation interpretation of opening-stage distinctions. A qualified reviewer must assess permissible preview/party-position procedure; no legal approval is asserted.

## TDD and current verification

Journeys: counsel can give a useful qualified roadmap; restricted notice cannot establish a transaction or participation; record gaps cannot become claims of non-existence; repair must retain the same boundaries.

`c09603c` records runtime RED: two tests failed specifically for the missing outbound opening contract; five controls passed. `fb7158d` records the prompt correction and GREEN: `npm test -- tests/crownOpeningFaithfulness.test.ts tests/courtroomPrompts.test.ts tests/grounding.test.ts` passed 16 tests in three files. Only this task's prompt delta was staged; earlier mixed `minimax.ts` edits remain unstaged. The positive-control metadata was subsequently completed to satisfy the project typecheck.

| Guarantee / gate | Current observed result |
| --- | --- |
| Recorded original and repair stay rejected | Pass through actual client + unchanged parser with recorded auditor judgments; four intercepted requests, no network |
| Transfer, participation, filing-completeness negatives | All three rejected; even an actual matching notice citation does not change an unsupported judgment |
| Positive qualified account control | Accepted, useful account text retained, zero repairs; test-authored control/auditor response, not a new live response |
| Fabricated envelope contents / forged quote | Rejected; valid exhibit ID is insufficient |
| `npm run build`, `npm run typecheck`, `npm run lint` | Pass |
| Dedicated evaluator TypeScript check | Pass with `npx tsc --ignoreConfig --noEmit --module esnext --moduleResolution bundler --target es2023 --types node --skipLibCheck scripts/evaluate-crown-opening.ts` |
| `npm run coverage:all` | Pass: 193 tests, 34 files; instrumented serial arguments/courtroom/UI journeys |
| Statements / functions / lines | 84.21% / 83.42% / 85.15% |
| Branches | **80.11%, 3,997 / 4,989**. Historical gate had **80.00%**, no margin; the current margin is just 0.11 percentage points. Thresholds and file exclusions unchanged. |
| `npm run test:sim` | Pass: 14 scripted checks; its “live” console wording does not make it a paid/live model result |
| `npm run eval:courtroom` | Pass: ten fictional scenarios × three scripted attempts; zero provider calls |
| `npm audit` | Zero vulnerabilities |

The historical verifier's analysis-label inconsistency is not solved by replay: recorded judgments test application behavior, not independent semantic correctness. The unchanged verifier can still misclassify an unsupported non-monetary premise. The correction aims to prevent generating that premise; live reliability remains untested. Neither replay nor withholding is evidence of a successful live hearing.

See `candidate-evidence.json` for file hashes, exact fixture/verifier identity and tested results. See [the human packet](review-packet.md) and [the pending live plan](live-plan.md). All current examples are development data. No genuinely unseen holdout was supplied; independent unseen cases must be stored separately before a later evaluation.
