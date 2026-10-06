# Prepared paid opening test — authorization pending

**No new paid evaluation was executed. Earlier spending consent is not reused.** The prepared plan is `tmp/qa/courtroom/crown-opening/prepared-plan.json`; its SHA-256 is stored alongside it. The frozen request is the corrected Crown-opening task on the original limited-notice fixture. This fixture and the positive control are **development data**, not held-out cases. No genuinely unseen examples were supplied; preserve independently supplied unseen cases separately and do not tune against them.

## Frozen settings and allowance

Three predeclared attempts use the **same request bytes/fields**, source text, model and candidate. Settings: MiniMax-M3, generation temperature 0, verification temperature 0, medium reasoning effort, 16,000 maximum response tokens, two-minute request timeout, one shared outer retry/repair and at most one checker-format correction per author draft.

Allowance per attempt conservatively budgets two author requests, two initial auditor requests, two possible auditor-format corrections and two transport reserves. The current client shares transport retry with author repair; it does not independently add all of these. Hard aggregate limits: **24 HTTP requests, two million request-body characters and twelve minutes**. The transport includes verification and repairs in its counters and enforces the remaining elapsed budget. Budget exhaustion is a failure, not a pass.

Historical comparison: the source-failed run consumed four HTTP requests, 18,718 reported tokens and about 107 seconds. Timeout usage may be unavailable. Maximum response allowance is theoretically 384,000 tokens plus input, though expected use is lower; monetary cost is **unknown**, and this runner enforces no dollar cap. Approving this plan accepts those count/time/token allowances and the unknown monetary charge. If a dollar ceiling is desired, provider billing must supply an enforceable cap before authorization.

Prepared plan and all server sources, the evaluator, fixture, dependency lock and Node version are hashed. Any candidate/runtime drift invalidates execution. Credentials remain in the existing environment, never in the plan or result bodies.

The evaluator defaults to **offline preparation**:

```powershell
npx tsx scripts/evaluate-crown-opening.ts
```

It refuses `--live` without fresh approval of the exact plan SHA-256. That guard was exercised locally and rejected before loading or contacting a provider. After the user approves the exact allowance and hash, the authorized operator can run:

```powershell
npx tsx scripts/evaluate-crown-opening.ts --live --approved-plan-hash=APPROVED_SHA256
```

This command is a prepared future action, not current authorization. Do not regenerate the plan between approval and execution. Never paste credentials into chat or logs.

## Predeclared measures and progression rule

Each attempt records first-response success, success after the permitted repair, withheld output, timeout/transport error and budget stop separately. It captures request-body hashes, parsed fictional author/checker outputs, final factual audit, HTTP requests, reported tokens when complete, elapsed time and unknown cost. Invalid JSON is left to the unchanged provider/parser repair path and is not mislabeled as a network timeout.

First-response success requires a passed source check, no author repair and a useful supported proposition, rather than only an empty ceremonial or entirely withheld response. Checker-format retries are separately visible in the audit. Repair success does not count as first-response success. A transport retry prevents a clean first-response score.

Proceed only if **all three attempts produce useful source-supported responses**, at least **two pass on the first response**, and there is no unresolved factual claim, withheld attempt or transport/budget failure. Check both source-faithfulness and the narrow opening contract manually; a checker “analysis” label alone cannot authorize unsupported future-contention language. These criteria are a pilot progression rule, not a reliability estimate, legal readiness finding or pass^3 across unseen cases.

## Next visible-browser hearing, separately authorized after that gate

Prepare one fictional `courtroom_v1` hearing through the supported Full Proceeding workflow. Use an isolated persistent database under `tmp/qa/courtroom/visible-live-hearing`, with `JUDGE_JURY_DB_PATH` pointing to its absolute path and separate source/corpus directories. Start only task-owned API/client processes on verified free ports. Keep MiniMax configuration confined to those processes, preserve existing servers, and open the local app in a **visible desktop browser** (not the headless scripted test harness).

Use fictional approved sources, a reviewed-for-testing fixture packet and its explicit limited-purpose/audience ledger. Create and approve the model and select the opt-in protocol using the existing workspace; record the exact packet, source, ledger and run IDs. Keep all witness accounts, proposed allegations and unknown propositions traceable. A real packet still requires a qualified legal review.

Start the supported autonomous workflow. Watch real generated openings, question/answer turns, completion acknowledgements, charge, independent ballots and deliberation. Use visible courtroom controls for needed procedural rulings/checkpoints; do not insert scripted substantive later stages or force a verdict. A failed source check, invalid ballot or incomplete examination remains a visible failed/paused hearing, with its evidence preserved.

After a completed run, record the actual verdict/status without prescribing it. Reload the browser, reopen the saved run, compare event/ballot/source/packet hashes, and verify persistent saved-result recovery. Inspect participant views for restrictions and privacy. Save screenshots and model audits. Stop only task-owned processes and retain the isolated database. No full hearing has been executed or claimed by this task; its provider allowance must be separately prepared and approved before spending.
