# Full Proceeding improvements — 2 October 2026

## Changes

1. Generated factual claims undergo a separate review against the permitted source paragraphs. The review checks amounts, parties, payment direction and attribution; a valid exhibit identifier alone is insufficient. The server resolves paragraph references to exact source text, checks complete review coverage and rejects invalid quotations. Formatting failures retry the checker; substantive failures request a bounded correction from the author. Rejected output and repair history remain in the audit.
2. Approved case models record primary/summary/advocacy classifications, whole-document/extract coverage and material outside the run. Source restrictions and extraction warnings reach the model and checker. Absence from the input is explicitly distinguished from absence in disclosure. Saved proceedings retain their source scope even after later imports.
3. The selected proceeding, model, private briefs, source-use settings, decisions and audit reopen after reload. Failed runs resume from their saved phase. The resume response now acknowledges `running` before worker dispatch, and clears the stale error so the browser continues polling.
4. The Full Proceeding banner uses the saved run's provider, model, panel size and external-disclosure confirmation.
5. Visible editors support parties, counts, legal elements, burdens, prepared-model JSON import, source coverage and versioned source-use restrictions. Validation rejects incomplete limits, invalid references and foreign-matter ledgers. Importing a model and immediately editing its title now retains the imported parties and counts.

Two further defects found during the live exercise were corrected: scanned PDF pages with a page-number-only text layer now trigger local OCR, and isolated juror responses must contain exactly one matching juror. OCR text is marked for review and original bytes are preserved. Partial extraction warnings do not label successfully extracted text as a total extraction failure.

## Verification

| Command/check | Result |
| --- | --- |
| `npm test` | 132 tests passed across 20 files |
| `npm run build` | TypeScript and production build passed |
| `npm run lint` | Passed |
| `npm run test:arguments` | Passed: prepared-model import, editors, private briefs, source restrictions, intentional failure/resume, checkpoint, split ballots, decision display, archive, three robustness variants and reload |
| `npm run test:ui` | Passed earlier in this change set |
| `npm run test:sim` | Passed earlier in this change set; scripted compatible provider, not an external-model quality test |
| Real PDF OCR check | Passed: scanned appendix body recovered, source hash preserved and OCR warning exposed |
| Live negative factual check | Reversed payment-direction claim rejected; corrected direction accepted |
| Final real-provider workflow and process restart | Passed: 208 HTTP-200 calls returning `MiniMax-M3.1-Flash-Preview`; 48 valid ballots; 36 deliberation contributions; both proposed issues completed; no browser errors; saved model, source ledger, events, coverage, ballots and decisions survived a fresh process/browser with zero new model calls |

The final private run used seven primary documents/excerpts (196 pages) and the existing opposing advocacy drafts. It completed in 26.9 minutes. All 88 actor outputs passed source review; 13 outputs required author repair, with no exhausted retries, discarded contributions or invalid ballots. Checker-format retries are recorded separately. Usage was 18,286,169 input tokens and 164,990 output tokens (18,451,159 total); no monetary cost was inferred. Detailed issue outcomes and source provenance are in the private result report.

Browser regression fixtures are explicitly fictional. The substantive live exercise uses a separate private primary-document packet and the user's existing opposing advocacy drafts. Private documents, prompts, model outputs, database, source hashes, screenshots and archive remain under ignored `tmp/qa/` paths. They are not part of this public QA note.

## Limits

The factual checker uses the configured model and can miss semantic errors. Exact source quotation proves traceability, not authenticity, admissibility or truth. OCR and table extraction require review against original page images. Scenario issues and legal elements still require legal review. A single synthetic panel on selected documents is not a prediction of a real court outcome, nor a robustness result. Earlier unaudited runs are not retroactively marked verified. Verification and repair add provider latency and token usage.
