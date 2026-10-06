# ECC courtroom follow-up — October 3, 2026

The automated software gates now pass. Independent behavioral review and qualified legal review remain open; the protocol stays opt-in. This follow-up uses ECC's TDD workflow and verification loop with fictional fixtures only.

## Changes and regression evidence

Evidence permissions now include original paragraph IDs, issue IDs, party IDs, permitted purposes and prohibited purposes. Projection applies redactions before model input, strips restricted metadata, and rejects references to unavailable passages or purposes. Unknown scope withholds scoped material. Previously visible events and assessments lose usable content after restrictions change. Witness projections do not retain metadata from another witness's account. Controls and archive round-trips preserve the scope.

Queued corpus imports now retain the preview hash separately from the preserved-blob foreign key. Processing rejects changed bytes before registering evidence. Existing queued jobs use their saved preview as a fallback. Schema 7 adds evidence scopes; schema 8 adds the expected preview hash. Archive format remains 3 with legacy 2 support. Deferred ZIP entries retain the documented archive-member integrity limitation.

Invalid model ballot references now produce an invalid ballot and withheld decision instead of a foreign-key crash. Examination prompts distinguish questions and completion acknowledgements from openings and rebuttals. Sparse fictional records no longer receive a minimum-length instruction that encourages invented content. Factual verification remains enabled.

| Regression | Observed failure before correction | Verification after correction |
| --- | --- | --- |
| Scope projection and references | Unsupported scope module/contracts and authorization leaks | Eight boundary/integration tests |
| Live actor prompts | Question/completion stages used conflicting counsel roles | Two outbound-request tests |
| Ballot reference recovery | Foreign instruction/change-event references caused SQLite failure | Four invalid-output/authorization cases |
| Corpus formats and source drift | Preview hash was lost; putting it in the blob FK broke imports | Three format/drift cases and existing corpus suite |

Focused checkpoints: `d7fd9e4`, `81c6d89`, `d18d475`, `876ac78`, `c957fed`. The initial dirty checkout was captured in ignored `tmp/qa/courtroom/followup-baseline.diff` and `followup-baseline-status.txt`; mixed pre-existing files were not swept into these commits.

## ECC verification

| Gate | Actual result |
| --- | --- |
| `npm run build` | Pass |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run coverage:all` | Pass: 186 tests, 33 files, serial browser journeys included |
| Aggregate statements | 84.17%, 8,243 / 9,793 |
| Aggregate branches | 80.00%, 3,980 / 4,975 |
| Aggregate functions | 83.42%, 1,399 / 1,677 |
| Aggregate lines | 85.10%, 7,645 / 8,983 |
| `npm run test:sim` | Pass: 14 checks |
| `npm run eval:courtroom` | Pass: ten scenarios, three attempts each; 2,133 scripted actor requests, zero provider calls |
| `npm audit` | Zero vulnerabilities, including development dependencies |
| Secret-pattern check | No matches in inspected source/test/script/document paths |
| `git diff --check` | Pass |

Coverage includes all configured server/client TypeScript files. Vitest measures server execution; Playwright V8 source maps measure client execution through the arguments, courtroom and UI journeys. Measured client maps replace incompatible Vitest counters, while unobserved files remain in the denominator. Reports are under `coverage/combined`; command output is `tmp/qa/courtroom/all-coverage.log`. Branch coverage meets the threshold exactly, with no margin. CI now enforces `coverage:all` and a full dependency audit.

Dependency remediation updates the lockfile and upgrades Vitest/coverage to 4.1.11. Direct report-generation dependencies are declared explicitly. Corpus extractor provenance reports the installed mailparser version rather than a stale hard-coded version.

## Live and independent review

The local `qwen2.5:7b` still invented unsupported facts after one repair; its outputs were withheld. The user authorized MiniMax with fictional fixtures. The first MiniMax-M3 pilot passed the Crown opening, then timed out during the defence opening: six HTTP requests, two actor requests, about 155 seconds; token usage/cost unavailable. This is a failed pilot, not a reasoning-quality pass.

The full-suite retry selected all ten scenarios with a 1,800-HTTP-call, 60-million-character and fifteen-minute cap; per-request timeout was two minutes. It stopped on the first Crown opening after one repair: four HTTP calls, 18,718 reported tokens and about 107 seconds. The original response overclaimed that the supplied exhibit was the only filed exhibit. The repair narrowed that claim, but still asserted a transfer and the accused's participation without supporting source evidence. A limited notice exhibit cannot establish those facts. The output was correctly withheld; nine remaining scenarios were not executed.

Reports are `live-evaluation-2026-10-03T07-50-45-196Z.json` (timeout pilot) and `live-evaluation-2026-10-03T07-56-16-993Z.json` (source-verification failure), under ignored `tmp/qa/courtroom`. The latest alias includes the failed factual-check audit and input/context hashes. No real case was transmitted. Successful live completion, three-attempt reliability and independent rubric adjudication are not established. Retrying the same failing source condition or loosening verification would not close these gates.

The [release review worksheet](courtroom-release-review.md) is ready for a qualified reviewer. No real packet or qualified reviewer was supplied, so no legal attestation or human grading has been fabricated. Those external review gates cannot be closed by software tests.
