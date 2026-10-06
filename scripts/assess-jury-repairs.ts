import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { hashBytes } from './pilotEvidence'
const runtime=resolve('tmp/qa/jury-followup')
const { normalizeStageResult } = await import(pathToFileURL(join(runtime,'server/minimax.ts')).href)
const root=join(runtime,'tmp/qa/courtroom/jury-repairs')
const reports=[]
const independent=JSON.parse(await readFile('docs/qa/jury/targeted-independent-review.json','utf8'))
for(const name of (await readdir(root)).filter(n=>n.startsWith('live-'))) {
 const base=join(root,name), plan=JSON.parse(await readFile(join(base,'approved-plan.json'),'utf8'))
 let pairs=0,errors=0,failed=0,incomplete=0,mismatches=0,knownTokens=0
 const jobs=[]
 for(const job of plan.jobs) {
  const directory=join(base,job.id), result=JSON.parse(await readFile(join(directory,'results.json'),'utf8'))
  let originalFormatError=null
  try {normalizeStageResult(JSON.stringify(job.original),job.request.stage,job.request.evidence,true,job.request)}catch(error){originalFormatError=String(error)}
  for(const http of (await readdir(directory)).filter(n=>n.startsWith('http-'))) {
   const folder=join(directory,http),exchange=JSON.parse(await readFile(join(folder,'exchange.json'),'utf8'))
   if(hashBytes(await readFile(join(folder,'request-body.txt')))!==exchange.requestHash)mismatches++
   if(exchange.state==='received'){pairs++;if(exchange.httpStatus>=400)errors++;if(hashBytes(await readFile(join(folder,'response-body.raw')))!==exchange.responseHash)mismatches++}
   else if(exchange.state==='failed')failed++;else incomplete++
   knownTokens+=exchange.reportedUsage?.total_tokens??0
  }
  const manual=independent.runs.find((r:any)=>r.planHash===hashBytes(JSON.stringify(plan,null,2)+'\n'))
  jobs.push({id:job.id,state:result.state,sourceCheckerRejected:result.originalRejected,originalFormatError,observedFailureRejected:result.originalRejected||Boolean(originalFormatError),repairs:result.generated?.grounding?.repairs,error:result.error,usage:result.usage,independentFreshResponseReview:manual?.failed?.find((j:any)=>j.id===job.id)??{status:manual?.defaultStatus??'unreviewed',notes:manual?.notes??'No independent review recorded.'}})
 }
 reports.push({planHash:hashBytes(await readFile(join(base,'approved-plan.json'),'utf8')),sourceCandidate:plan.sourceCandidate,jobs,rawIntegrity:{pairs,errors,failed,incomplete,mismatches,knownTokens}})
}
await mkdir('docs/qa/jury',{recursive:true})
await writeFile('docs/qa/jury/targeted-repair-summary.json',JSON.stringify(reports,null,2)+'\n')
console.log(JSON.stringify(reports.map(r=>({hash:r.planHash,jobs:r.jobs.length,rejected:r.jobs.filter(j=>j.observedFailureRejected).length,sourceRejected:r.jobs.filter(j=>j.sourceCheckerRejected).length,firstAccepted:r.jobs.filter(j=>j.repairs===0).length,finalAccepted:r.jobs.filter(j=>j.state==='finished').length,integrity:r.rawIntegrity})),null,2))
