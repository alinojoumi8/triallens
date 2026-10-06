import 'dotenv/config'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig, normalizeStageResult } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes, assertApprovedPlan } from './pilotEvidence'
const root='tmp/qa/courtroom/jury-negation', planPath=root+'/plan.json'
if(!process.argv.includes('--live')) {
 const source=resolve('tmp/qa/jury-candidate/tmp/qa/courtroom/full-jury/live-406ba52cb9a95f6dfef0ef7ecfc1718ccb4243b09d5cf036b918389f24811358-1791136855547')
 const jobs=[]
 for(const [job,index] of [['hearing-Morgan',55],['hearing-Rowan',48]]) {
  const id=job+'-actor-'+index,dir=join(source,String(job))
  const request=JSON.parse(await readFile(join(dir,id+'-input.json'),'utf8'))
  let draft=null
  for(const folder of (await readdir(dir)).filter(n=>n.startsWith('http-')).sort()) {
   const x=JSON.parse(await readFile(join(dir,folder,'exchange.json'),'utf8'))
   if(x.actorRequestId===id&&x.requestRole==='author'&&x.state==='received'&&x.httpStatus===200) {
    const envelope=JSON.parse(await readFile(join(dir,folder,'response-envelope.json'),'utf8'))
    draft=normalizeStageResult(envelope.choices[0].message.content,request.stage,request.evidence,true,request)
   }
  }
  if(!draft)throw new Error('No actual author response retained for '+id)
  jobs.push({id,request,draft,expected:'passed'})
 }
 const files=[...(await readdir('server',{recursive:true})).filter(n=>n.endsWith('.ts')).map(n=>join('server',n)),'scripts/evaluate-negation-repairs.ts','scripts/pilotEvidence.ts','package-lock.json'].sort()
 const plan={authorization:'User authorized steps 1-3 and unrestricted fictional MiniMax testing. Review two actual falsely rejected replies, reject corresponding positive proof assertions, and freshly replay those exact requests.',runtime:process.version,jobs,candidateSourceHashes:await Promise.all(files.map(async path=>({path,sha256:hashBytes(await readFile(path,'utf8'))}))),limits:{maxCalls:100,maxInputCharacters:20000000,maxElapsedMs:3600000,requestTimeoutMs:240000}}
 await mkdir(root,{recursive:true});await durableJson(planPath,plan);console.log('Prepared negation controls/replays; zero calls. Hash: '+hashBytes(await readFile(planPath,'utf8')))
} else {
 const encoded=await readFile(planPath,'utf8'),planHash=process.argv.find(a=>a.startsWith('--plan-hash='))?.split('=')[1]
 assertApprovedPlan(encoded,planHash);const plan=JSON.parse(encoded)
 if(process.version!==plan.runtime)throw new Error('Runtime changed')
 for(const s of plan.candidateSourceHashes)if(hashBytes(await readFile(s.path,'utf8'))!==s.sha256)throw new Error('Source changed: '+s.path)
 Object.assign(process.env,{MODEL_PROVIDER:'minimax',MODEL_TEMPERATURE:'0',MODEL_MAX_OUTPUT_TOKENS:'16000',MINIMAX_REASONING_EFFORT:'medium'})
 const run=root+'/live-'+planHash+'-'+Date.now();await mkdir(run,{recursive:true});await durableJson(run+'/approved-plan.json',plan)
 await Promise.all(plan.jobs.map(async (job:any)=>{
  const directory=run+'/'+job.id;await mkdir(directory,{recursive:true})
  const transport=new DurablePilotTransport(directory,plan.limits);let phase='actual-safe-reply'
  const client=new MiniMaxClient({...createMiniMaxConfig(),provider:'minimax',model:'MiniMax-M3',timeoutMs:240000,maxRetries:3},undefined,(input,init)=>{
   const body=JSON.parse(String(init?.body)),user=body.messages[1].content as string
   transport.setContext({caseId:job.id,phase,requestRole:user.startsWith('Stage: factual_verification')?'checker':'author',draftKind:user.includes('rejected the previous draft.')?'repair':'original',planHash});return transport.fetch(input,init)
  })
  const result:any={id:job.id,state:'started'}
  try {
   result.safeReview=await client.reviewGrounding(job.request,job.draft)
   phase='positive-proof-negative-control'
   result.proofReview=await client.reviewGrounding(job.request,{title:'',content:'No foundation has been supplied to meet BRD, but the attributed account satisfies the receipt element.',citations:[],jurors:[]})
   result.controlsMatched=result.safeReview.status==='passed'&&result.proofReview.status==='failed'
   phase='fresh-actual-request'
   result.generated=await client.generateStage(job.request);result.state='finished'
   console.log(job.id+': safe='+result.safeReview.status+', positive-proof='+result.proofReview.status+', replay finished')
  }catch(error){result.state='failed';result.error=String(error);console.log(job.id+': '+String(error))}
  finally{result.usage=transport.usage();await durableJson(directory+'/results.json',result);transport.dispose()}
 }))
 console.log('Evidence: '+run)
}
