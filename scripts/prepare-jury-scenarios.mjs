import { readFile, writeFile } from 'node:fs/promises'
let source = await readFile('scripts/evaluate-jury.ts', 'utf8')
source = source.replace('planPath = `${root}/plan.json`', 'planPath = `${root}/scenario-plan.json`')
source = source.replace("'scripts/evaluate-jury.ts',", "'scripts/evaluate-jury.ts', 'scripts/evaluate-jury-scenarios.ts', 'scripts/prepare-jury-scenarios.mjs',")
source = source.replace('  await mkdir(root, { recursive: true }); await durableJson(planPath, plan)', `  plan.controls = []; plan.jobs = plan.jobs.filter(job => job.scenario !== null)
  plan.scope = 'Twelve prepared-record jury scenarios, four families repeated three times, run alongside the separately frozen full hearing pair. Controls were 64/64 in candidate 995f1694; same production sources; no real-case data or legal certification.'
  await mkdir(root, { recursive: true }); await durableJson(planPath, plan)`)
source = source.replace('Prepared 14 trials; zero calls.', 'Prepared 12 scenario trials; zero calls.')
source = source.replace('  results.push(...await Promise.all(plan.jobs.slice(0, 2).map(trial)))', '  // Independent scenario jobs run alongside the separately frozen full hearing pair.')
source = source.replace('  let next = 2', '  let next = 0')
await writeFile('scripts/evaluate-jury-scenarios.ts', source)
