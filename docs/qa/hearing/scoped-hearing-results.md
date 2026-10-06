# Fictional hearing evaluation through closings

## Scope and acceptance rule

This evaluation uses only fictional MiniMax fixtures. It exercises Crown and Defence openings, persisted database restart, a live objection and scope ruling, an exact limiting instruction before jury return, direct examination, cross-examination, re-examination and both closings. It stops before jury deliberation or a merits decision. The one supplied fixture condition and its burden are fictional instructions, not verified applicable law.

A strict pass requires every predeclared negative control to be rejected for a substantive source reason, every positive control to be accepted, both actual-engine hearings to reach the closings checkpoint with all mechanical checks true, and independent review of every final accepted actor output against its permitted record. Automated acceptance and an exit code alone are insufficient. This is a development control set expanded from observed failures, not a held-out benchmark or a legal-quality certification.

## Changes

- Extended source auditing to later courtroom stages with approved actor roles, fictional instructions and authorized procedural event projections. Public submissions support attribution of what was said, not the truth of the allegation.
- Added narrow deterministic rejection of absent-content claims when their cited source says only that contents are unknown. Added controls for invented accused roles, offences, pleading status, record completeness, witness memory, observation omissions, opponent-position reversal and unsupplied physical properties.
- Replaced courtroom prompts that pressured counsel to manufacture opposition or corroboration. Supplied witness deferrals now preserve the approved-account boundary without inventing memory or knowledge limits.
- Separated an objection ruling from a jury verdict and supplied an explicit boolean completion contract. Independent MiniMax source audits use high reasoning effort; authors use medium.
- Added a reproducible two-variant live harness with frozen source manifests, raw HTTP request/response hashes, exact actor inputs and actual engine events. The harness never replaces a failed source-verified generation with canned testimony or advocacy.

## Candidate history

Historical failed candidates and their raw responses remain under `tmp/qa/courtroom/scoped-hearing/`. The machine-readable `evidence-summary.json` reports each run separately. Older candidate source hashes differ from the final worktree by design; their original frozen manifests remain available.

- Initial controls caught a question-presupposition false acceptance and a valid fictional ruling false rejection.
- Subsequent runs exposed unsupported court-record exclusivity, unknown contents presented as absent contents, account omission presented as non-observation, and witness boundary deferrals rejected as invented inability.
- Candidate `f7c8bf3ff376e87a92933b65ec825d8d4006ae3a4311fdb58669811471cc06ce` matched 26 controls and mechanically completed both hearings with 42 automated acceptances. Independent review found false acceptances: an explicit Defence denial reversed into an invitation, unsupported pleading absence, universal witness knowledge inferred from Mira alone, and a sealed envelope converted to an opaque object and proven handover. It is a failed source-faithfulness candidate, not readiness evidence.
- Candidate `03c0fe8e7585919dfb9e9e768ed4265ef19d8dedf2083354f41da785aa2906ed` matched 34 of 36 controls and did not start hearings. One positive control mistakenly assigned the Crown's own present agreement to a witness; the other exposed a denial of a universal inference misread as an assertion of universal knowledge. The fixture actor and audit contract were corrected after a failing regression.
- Candidate `62e247bd19767ec804a3aa16b87d4244986d19aa0a0a0d9efec652390086df90` matched all 36 controls. Independent review rejected Rowan actor 14: it claimed the limited-use ruling foreclosed any further inquiry without speculation, although neutral questions remained permitted. Only this evaluation's identified Node process was stopped; the incomplete HTTP exchange, actor rows and a separate `independent-stop.json` receipt were preserved. Morgan was not executed. Subsequent completion prompts omit testimony or legal-prohibition justifications, and two new controls cover the captured error. This cancellation is a failed source-faithfulness candidate, not a completed paired trial.
- Candidate `84dead2462de637c42ac2c718f286d0a0aa2645b78ed265a6389516a96fffd3b` matched 37 of 38 controls and started no hearings. Its valid neutral-question control was rejected because the auditor interpreted the fixture's shorthand "sustain questions" as allowing those questions. The fixture and control now explicitly sustain objections, strike unsupported-premise questions and permit neutral questions. Both actual-engine tests failed before this wording correction and passed afterward.

## Final evidence

The final candidate passed this scoped evaluation. Plan hash: `0bb68611c2f224124ddfecba5b1d1ddf42f794c37fbda6bb508b07527dd881cf`. Raw evidence: `tmp/qa/courtroom/scoped-hearing/live-0bb68611c2f224124ddfecba5b1d1ddf42f794c37fbda6bb508b07527dd881cf-1791074005790`.

| Measure | Result |
| --- | --- |
| Predeclared source controls | 38/38 matched: 19 negative rejections and 19 positive acceptances. |
| Actual engine hearings | Rowan and Morgan both reached the closings approval checkpoint. All ten mechanical checks passed for each. |
| Independent final-output review | 42/42 final actor outputs reviewed as source-faithful and useful for their roles in this fictional exercise. Individual notes are in `independent-review.json`; this is an AI assistant review, not qualified human legal review. |
| First responses and repairs | 38/42 accepted on the first response; four accepted after one repair each. No final generation failures. |
| Format or HTTP retries | Zero checker format corrections and zero HTTP retries in the final run. |
| Prepared counsel finish controls | Zero. The injected invalid QA question and prepared strike/instruction commands are declared harness controls, not model-authored testimony or native model audits. |
| Provider usage | 130 received HTTP responses: 46 author calls and 84 source-audit calls, including the 38 controls. Reported usage 774,008 tokens; 3,113,395 input characters; approximately 26 minutes. Cost was not reported and remains unknown. |
| Evidence integrity | 130 request/response pairs verified; zero raw hash mismatches, actor-input mismatches, failed or incomplete HTTP exchanges. |
| Native context provenance | All 38 native model-audit manifests resolve to the saved exact actor input and matching pinned legal-packet hash. The four manual live objection/ruling requests have separately saved inputs and are not represented as native audits. |
| Committed witness responses | Zero changes between accepted model answer text and committed witness-answer event text. |
| Candidate source drift | Zero against the frozen runtime source manifest. |
| Isolation and procedure | No excluded-source, opposing-private-theory, jury-out or struck-question marker leaks in the checked projections. Database restart preserved opening events without duplicates. Premature jury return was rejected; exact instruction preceded permitted return. No jury decision generated. |

The repaired outputs were Rowan's Defence opening (unsupported allegation status before the Court), Crown direct completion (incorrectly claiming no permissible inquiry remained), Crown re-examination completion (inaccurate description of what re-examination covered), and Morgan Crown re-examination completion (incorrectly claiming no neutral questions remained). Their rejected drafts, substantive reasons and repairs are retained. Automated review did not silently accept these first drafts.

Morgan's Defence closing could be clearer: its shorthand about unsupplied knowledge/participation is read in the context of the pinned offence-element limitations and its explicit repeated handover account. It should use "knowing-participation element" in a broader exercise. Its jury-return reminder repeats a standing instruction after return; it does not assert that instruction delivery is still unperformed. These are editorial limitations of the accepted fictional output, not actual-law findings.

To reproduce the source freeze and live run on this candidate, use `npx tsx scripts/evaluate-hearing.ts` to prepare a fresh plan, then `npx tsx scripts/evaluate-hearing.ts --live --plan-hash=<printed-hash>`. The runner verifies source and runtime hashes before dispatch. Regenerate the integrity summary with `npx tsx scripts/summarize-hearing.ts`. Raw historical captures stay local under ignored `tmp/`; the summary and individual review are the reviewable report artifacts.

## Verification and limits

ECC TDD used failing regressions before source changes and passing regressions afterward. Offline prompt/contract tests establish wiring and deterministic behavior; live controls and independent review assess source meaning separately. Combined unit/browser coverage is reported separately from unit-only coverage.

| Command | Result |
| --- | --- |
| `npx vitest run tests/hearingEvaluation.test.ts tests/hearingContext.test.ts tests/grounding.test.ts` | 29 tests passed after the final fixture wording correction. The completion-contract RED run had seven failures; both actual-engine tests failed before the objection wording correction. |
| `npm run coverage:all` | 236 tests in 39 files passed on the final candidate; combined statements 84.25%, branches 80.59%, functions 83.63%, lines 85.17%. |
| `npm run build` | Passed, including project TypeScript build and production bundle. |
| `npm run lint` | Passed. |
| `npx tsc --ignoreConfig --noEmit --target ES2023 --module ESNext --moduleResolution bundler --skipLibCheck --types node scripts/evaluate-hearing.ts` | Passed for the live runner and imported harness. |
| `npm run test:courtroom` | Scripted browser verification passed earlier in this task; not a live jury evaluation. |
| `npm audit --omit=dev --audit-level=high` | Zero vulnerabilities reported earlier in this task; no dependencies added by these fixes. |
| `git diff --check` | Passed after the final completion fix. |

The auditor sometimes labels missing support as contradiction in its explanation. The negative controls require substantive rejection, not an exact unsupported-versus-contradicted taxonomy. The deterministic absence guard is narrow; this evaluation does not prove a general formal guarantee against invented statements.

The tested candidate is the full existing worktree plus its frozen source manifest. Selective local checkpoints do not constitute a standalone tested release: pre-existing courtroom implementation and unrelated changes remain in the dirty checkout. No push, deployment, default enablement or real-case evaluation occurred. No qualified human legal review is claimed.

Project-summary receipt: TencentDB ingestion `65491fcf964057d09fc33f524485cab21724d8f9cf590332d5d6613de030af06` returned terminal `no_useful_memory`, with `stored_count: 0` and `failed_attempts: 0`. No extracted memory is claimed; the local report remains the verified record. Canceled-run usage values in the evidence summary are marked non-final snapshots; received raw exchanges supply only the known reported token sum.
