# Courtroom implementation evidence — October 3, 2026

This is the initial implementation record. The subsequent ECC hardening results, schema 8, dependency remediation and instrumented browser coverage are recorded in [courtroom-hardening.md](courtroom-hardening.md).

The plan has an implemented opt-in software path, with release gates still open. The existing proceeding remains available. This report distinguishes verified mechanics from live model quality and reviewed law.

## Changes

Participant memory is reconstructed from immutable events, bounded sequence, actor identity and current document-use rules. A common context builder supplies all roles and preserves early records; oversized input fails explicitly. Cached snapshots never grant visibility. Struck content loses usable text while its history remains identifiable, and dependent assessments are invalidated. Witnesses receive their approved passages and their own permitted preparation.

Courtroom commands validate actor, sequence, phase, pending question/objection, source ownership and jury state. Commands atomically commit event, state, admission pointer and idempotency receipt. Duplicate command IDs return their receipt; changed payloads fail. Direct, cross and re-examination require explicit completion acknowledgements. A question resource cap pauses unfinished examination. Model motion outputs are proposals requiring an explicit judicial disposition and structured effects.

Legal packets require complete issue elements, burdens, outcomes, cited instructions and an attestation bound to the exact content hash. Runs pin the packet. Counsel corrections, judicial responses, jury questions and pending instructions block progression where appropriate. Material legal changes require a new packet/run. Ballots reference the delivered instruction; changed votes require a relevant visible deliberation event with an explanation.

The workspace provides participant memory, structured courtroom controls and a legal-readiness editor. Saving a packet creates a new model version that requires normal approval. Schema 6 and archive v3 preserve protocol state, receipts and original execution inputs; legacy archives remain readable. Imported derived references/hashes are rebuilt while original serialized actor requests remain execution evidence with explicit import provenance.

## TDD and verification

Baseline: 139 tests in 21 files; typecheck, lint, build, simulation (14 checks), arguments browser (20 checks) and UI browser passed.

| Increment | Observed RED | GREEN evidence |
| --- | --- | --- |
| Actor memory | New tests failed because actorMemory module did not exist | Long record, actor privacy, jury absence, strikes and witness scope tests pass |
| Courtroom reducer | New tests failed because courtroomState module did not exist | Question/objection/stage/instruction state tests pass |
| Legal packet and integration | New tests failed because legalPacket module did not exist | Readiness, pinning, transaction rollback and command rejection tests pass |
| Explicit examination completion | Regression expected evidence checkpoint but got instructions checkpoint | Missing acknowledgement now pauses; fixture completion acknowledged explicitly |

Additional regressions were added after implementation; they are not claimed as RED-first. Early failures exposed archive checksum order, schema expectations and full-document witness references; those were corrected. A browser selector failure was corrected using an explicit accessible label.

Final automated checks: `npm run test:coverage` passed **168 tests in 28 files**; `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:sim`, `npm run test:arguments` and `npm run test:ui` passed. The courtroom browser suite passed five checks and the scripted evaluation passed 30/30 attempts across ten scenarios. Final reruns are recorded under `tmp/qa/courtroom`.

Coverage across all included server/client files: statements **64.25%**, branches **56.12%**, functions **57.30%**, lines **67.20%**. Server aggregate: statements 85.82%, branches 75.15%, functions 90.06%, lines 88.76%. Browser checks do not instrument client coverage. The 80% overall gate is **not met**.

`npm audit --omit=dev` failed with eight findings (seven high, one moderate) in production dependencies. Dependency remediation was not folded into this feature. `git -c core.safecrlf=false diff --check` passed. No commit, push or publication was performed. The checkout already contained substantial unrelated edits; baseline status/diff and task evidence were preserved without sweeping them into ECC checkpoint commits. Checkpoint commits remain missing; .git is currently writable, so this is an ownership/scope limitation, not a filesystem denial.

## Acceptance status

| Criteria | Evidence / remaining boundary |
| --- | --- |
| A01–A04 memory/privacy/witness/strike | actorMemory and courtroom integration tests; generated input audit; browser privacy check. Exact redactions and document-level use are covered; richer passage/issue scopes remain open. |
| A05 examination recovery | Reducer, engine completion regression and browser replacement/direct/cross/re-examination journey pass. |
| A06 partial admission | Structured effects apply only specified owned sources; explicit purposes/redactions. Independent paragraph scopes and semantic prohibited-purpose enforcement remain open. |
| A07 jury/instructions | Jury absence context tests and browser return/instruction gate pass. |
| A08–A09 command/atomic recovery | Duplicate/conflicting receipts, stale sequence, wrong role, cross-run target and transaction fault tests; recovery rebuilds state from events. |
| A10–A11 packet/instruction | Hash-bound review/start gates and ballot instruction validation pass. Qualified legal correctness review is pending. |
| A12 changed votes | Relevant visible event/source/explanation validation replaces automatic attribution in the new protocol. Nuanced reasons need human grading. |
| A13 archive | Legacy archive regression and protocol archive round-trip tests pass; original actor input provenance is preserved separately from remapped current references. |
| A14 reload | Completed courtroom browser reload preserves saved record; immutable packet/trace behavior covered in workflow/archive tests. |
| A15 regressions | Existing civil/tribunal/unit, simulation, arguments and UI browser checks pass. A parallel browser run timed out; serial rerun passed. |
| A16 evaluation | Bounded runner and transport tests pass; live failure, budgets and usage saved honestly. Full live suite and human adjudication remain open. |

## Retained failures and release gates

The initial scripted 30-million-character budget exhausted after 1,429 actor calls. Its report was retained before explicitly increasing the scripted-only budget. Live reports retain connection failure, request timeout and a source-verification rejection. The final live pilot used two HTTP calls and reported 4,039 tokens, with no accepted output or completed scenario. Unknown cost is not zero cost.

Release requires broader client/branch coverage, a successful bounded live suite with independent semantic grading, qualified legal packet review, richer restriction scope, production dependency audit remediation and an appropriate reviewed task diff/checkpoint. Source checks remain enabled; they were not weakened to make the live pilot pass. Tests establish these observed software behaviors, not legal accuracy or real-case prediction.
