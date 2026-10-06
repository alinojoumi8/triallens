# Live MiniMax full-proceeding validation — 2 October 2026

This records the earlier live run. The UI setup, reopening and banner gaps described below were subsequently addressed and verified by the fictional browser regression in [the evidence-to-decision validation](2026-10-02-evidence-to-decision.md). That subsequent regression uses scripted actors and makes no new claim about live-model quality.

The live browser/API run uses `MiniMax-M3.1-Flash-Preview` and an existing user-supplied preparation packet. Sensitive sources, briefs, provider output, the SQLite database, screenshots and the result report are kept under ignored `tmp/qa/osc-live-20261002/`. They are not repository fixtures.

## Corrections made for the live run

- Send the already-filtered source texts when a stage has no retrieved chunks. Previously, the full trial engine supplied `evidence`, but the provider serializer omitted its text.
- Carry admission status, permitted use and use notes into actor prompts. Existing exclusion, role visibility and redaction filtering remains in the trial engine.
- Preserve the configured external-provider output budget for secret ballots, since reasoning tokens share that budget. Local secret ballots retain their smaller cap.
- Support the optional `MINIMAX_REASONING_EFFORT` setting, documented in `.env.example`.
- Distinguish final ballots from initial independent ballots and repeat the controlling issue elements in every ballot request so recent-event truncation cannot remove them.

The live configuration uses low reasoning effort, an 8,000-token output ceiling and a 180-second request timeout. A fetch wrapper forwards every request to the real provider and records returned model identity, usage, finish reason and source-presence checks. No model response or verdict is mocked. Provider reasoning and credentials are not persisted in the audit.

## Validation

- `npx vitest run tests/modelProvider.test.ts tests/trialEngineV2.test.ts`: 39 passed.
- `npm test`: 118 passed in 17 files.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npx vitest run tests/modelProvider.test.ts`: 16 passed after adding the final-versus-initial prompt assertion.

The live harness is run with `npx tsx tmp/qa/osc-live-20261002/run.mts`. The private `RESULTS.md`, `trial.json`, `provider-audit.jsonl` and browser screenshots record its actual outcome and limitations.

The run completed in 10.8 minutes with 88 live HTTP 200 responses, all reporting the requested model and a `stop` finish reason. All 48 initial/final ballots were valid. Both decisions rendered, and a self-contained matter archive was exported. No browser exceptions or private-input marker leakage were observed. A fresh process recovered identical decisions and ballots without additional provider calls (`npx tsx tmp/qa/osc-live-20261002/reopen.mts`).

## Scope of the browser proof

The real browser creates the matter, imports the prepared files, approves the model, saves separate side briefs, reviews disclosure, drafts motions, starts the run and renders the decisions. Setup supplies a prepared custom count model through the real draft API request and creates the limited-use ledger through the application repository because the UI cannot edit those complete structures. This is not proof that every setup step can be performed through unassisted clicks.

Known UI gaps remain: the full-proceeding selection is not restored after reload, and the provider banner can display the legacy panel size and disclosure-confirmation status during a full criminal proceeding. The live screenshot and fresh-process browser check confirm these inconsistencies. The private report also records a confirmed factual error in generated advocacy; HTTP success and valid exhibit IDs do not establish semantic citation accuracy.
