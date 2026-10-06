import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hashBytes } from './pilotEvidence'
const root='tmp/qa/courtroom/jury-negation', reports=[]
const manual=JSON.parse(await readFile('docs/qa/jury/negation-independent-review.json','utf8'))
for(const name of (await readdir(root)).filter(n=>n.startsWith('live-'))) {
 const base=join(root,name),encoded=await readFile(join(base,'approved-plan.json'),'utf8'),plan=JSON.parse(encoded),planHash=hashBytes(encoded)
 let pairs=0,errors=0,failed=0,incomplete=0,mismatches=0,knownTokens=0
 const jobs=[]
 for(const job of plan.jobs) {
  const directory=join(base,job.id),result=JSON.parse(await readFile(join(directory,'results.json'),'utf8'))
  for(const http of (await readdir(directory)).filter(n=>n.startsWith('http-'))) {
   const folder=join(directory,http),exchange=JSON.parse(await readFile(join(folder,'exchange.json'),'utf8'))
   if(hashBytes(await readFile(join(folder,'request-body.txt')))!==exchange.requestHash)mismatches++
   if(exchange.state==='received'){pairs++;if(exchange.httpStatus>=400)errors++;if(hashBytes(await readFile(join(folder,'response-body.raw')))!==exchange.responseHash)mismatches++}
   else if(exchange.state==='failed')failed++;else incomplete++
   knownTokens+=exchange.reportedUsage?.total_tokens??0
  }
  jobs.push({id:job.id,state:result.state,safeOriginal:result.safeReview?.status,positiveProof:result.proofReview?.status,controlsMatched:result.controlsMatched,repairs:result.generated?.grounding?.repairs,error:result.error,usage:result.usage,independentFreshResponseReview:manual.runs.find((r:any)=>r.planHash===planHash)?.jobs.find((r:any)=>r.id===job.id)??{status:'unreviewed'}})
 }
 reports.push({planHash,jobs,rawIntegrity:{pairs,errors,failed,incomplete,mismatches,knownTokens}})
}
await writeFile('docs/qa/jury/negation-repair-summary.json',JSON.stringify(reports,null,2)+'\n')
console.log(JSON.stringify(reports.map(r=>({hash:r.planHash,controlsMatched:r.jobs.filter(j=>j.controlsMatched).length,jobs:r.jobs.length,firstAccepted:r.jobs.filter(j=>j.repairs===0).length,finalAccepted:r.jobs.filter(j=>j.state==='finished').length,raw:r.rawIntegrity})),null,2))
