# Public snapshot — 6 October 2026

TrialLens is published at https://github.com/alinojoumi8/triallens as an experimental development snapshot. The README and brand artwork use the new identity; the app interface still contains Judge & Jury and TrialForge labels. The remaining rebrand is described in the [plan](plans/2026-10-06-triallens-rebrand.md).

## Publication boundary

This repository starts with fresh Git history from a reviewed working-tree copy. The original checkout and its Git history remain separate. Local environment files, databases, uploaded evidence, generated provider transcripts, logs, dependency folders, coverage output, and runtime artifacts are excluded. Included scenario packets are fictional software fixtures. Payment-direction tests were given fictional company names and amounts for publication.

Historical QA documents describe their own runs, failures, and limitations. They are not current certification. Private live-run sources and outputs are excluded; a historical report may refer to their ignored paths without publishing them.

## Validation performed on the publication copy

| Command/check | Result |
| --- | --- |
| `npm ci --no-fund` | Passed; dependency advisories reported |
| Gitleaks 8.30.1 directory scan, redacted output | No secrets detected |
| `npm run lint` | Passed |
| `npm test` | 438 passed, 1 skipped across 60 test files |
| `npm run build` | Passed, including TypeScript compilation |
| `npm run test:sim` | All 14 scripted checks passed |
| `npm run test:ui` | Passed |
| `npm run test:arguments` | All 20 fictional browser workflow checks passed |
| `npm run test:courtroom` | All 5 browser checks passed |
| `npm run eval:courtroom` | All 30 scripted attempts passed |
| `npm run coverage:all` | Passed; 439 tests including browser coverage, aggregate 80% thresholds met |

The first copied snapshot had two failing supplied-element/advocacy tests. The working checkout received the existing fixes in `4d972ef` and `10baaac` during validation; the corrected files were included and the full suite was rerun successfully. The fictionalized payment tests passed in that rerun. These scripted checks do not establish live model quality, legal accuracy, or real-world predictive performance.

## Dependency advisories

`npm audit fix --no-fund` updated compatible dependencies, including `proxy-addr` to 2.0.8 and `source-map-js` to 1.2.2. The audited copy has **0 critical, 0 high, and 3 moderate** advisory entries. The remaining entries are the `sprintf-js` / `argparse` / `mammoth` chain. npm proposes a breaking downgrade of Mammoth for its force fix; that downgrade was not applied.

`npm audit` therefore exits with status 1. The GitHub workflow retains its audit step, so this known advisory condition can fail CI even when the behavior checks pass. Review the upstream fix before treating this snapshot as a release.

No real provider evaluation was performed for publication. Qualified legal review and other release gates remain as documented in the existing QA material.
