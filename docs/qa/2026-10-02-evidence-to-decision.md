# Evidence-to-decision implementation and example validation — October 2, 2026

The current checkout already restored saved Full Proceedings and displayed their actual provider and panel. The browser baseline passed those checks. The missing element evidence matrix, source passage viewer, saved decision trace and per-run scenario comparison have now been implemented.

## Example

The packet in `samples/criminal-fraud/` is entirely fictional: a $20,000 equipment deposit, a $15,000 operating transfer and an ambiguous customer email. Crown and defence briefs remain private to their respective actors and are excluded from source evidence.

The extended browser workflow maps the bank extract and email to an element as supporting and contrary material, adds two open questions, saves/approves the model, opens a source with its hash and surrounding text, and downloads the preserved original. The base scripted panel splits nine guilty to three not guilty, producing no verdict. It records twelve initial and twelve final valid ballots.

Three variants retain the baseline record and result. A further admission version excludes the bank extract; three variants using that version return twelve not-guilty scripted ballots each. The comparison displays the changed starting/final document use and nine changed choices per variant. These predetermined responses verify application behaviour, not substantive legal reasoning or live-model quality.

The base decision trace remains identical after saving the alternate record and reloading the browser. Source/model/ledger/event/ballot references survive archive import with collision-safe new IDs. Exact quotations are resolved by the server; foreign-source IDs, nonexistent elements/passages and altered quotations fail validation. Isolated ballot explanations are omitted from public and actor decision views.

## Corrections found in validation

- Only completed runs now contribute to robustness counts; an unfinished run with a decision sheet was previously counted as completed.
- Robustness variants reuse the baseline's recorded starting ledger by default, avoiding accidental reuse of its final post-ruling record.
- Archive import now remaps ballot IDs embedded in decision traces as well as the ballot rows.
- The Windows smoke harness now launches direct Node children. Its npm/cmd server wrapper trees previously survived cleanup in the restricted environment; the first browser run reached its final screenshot and its verified test-only server trees were cleaned up. The corrected harness reran and exited successfully without manual cleanup.
- Scenario settings are readable descriptions; repeated seeds identify their starting record version. Long ballot/audit lists expand on demand.
- Historical QA reports now link to this later verification instead of leaving fixed UI defects looking current.

## Commands and results

| Command | Result |
| --- | --- |
| `npm test` | PASS: 139 tests in 21 files |
| `npm run test:arguments` | PASS: 20 browser/API/storage checks, seven completed Full Proceedings, 449 injected model calls, zero browser exceptions or failed API responses |
| `npm run test:ui` | PASS; corrected direct-child harness exits successfully |
| `npm run test:sim` | PASS: all 14 scripted simulation checks |
| `npm run typecheck` | PASS |
| `npm run build` | PASS, including TypeScript compilation |
| `npm run lint` | PASS |
| `git diff --check` | PASS |

The Full Proceeding browser regression is also included in CI. No new dependency or database migration is required.

## Artifacts and limits

`tmp/qa/arguments/` contains `report.json`, `trial.json`, `robustness.json`, the fictional matter archive, and `matrix.png`, `decision.png`, `scenario-comparison.png` and audit screenshots. These ignored outputs are locally reviewable; the fictional inputs and tests remain reusable repository files.

There were no external provider calls in this validation. PDF page navigation uses actual matching derived-page metadata; documents without that metadata still show exact extracted paragraphs and offer the preserved original. Older decisions are not retroactively assigned evidence traces or source-check status. Matrix stances remain manual preparation annotations and are not treated as findings of fact. Scenario comparisons do not establish what caused a changed outcome.
