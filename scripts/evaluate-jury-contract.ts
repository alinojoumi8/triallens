import 'dotenv/config'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { validateJuryBallotContract } from '../server/juryBallotContract'
import { DurablePilotTransport, durableJson, hashBytes } from './pilotEvidence'
const root='tmp/qa/courtroom/jury-contract', planPath=join(root,'plan.json')
if (!process.argv.includes('--live')) {
 const oldRoot='tmp/qa/jury-ledger-final-v3/tmp/qa/courtroom/full-jury'
 const baseline=join(oldRoot,(await readdir(oldRoot)).find(n=>n.startsWith('live-432144a'))!)
 const jobs:any[]=[]
 for (const [trial,actor,expected,replay] of [['Rowan',25,'failed',true],['Rowan',75,'failed',true],['Morgan',24,'failed',true],['Rowan',46,'passed',false],['Morgan',72,'passed',true],['Rowan',76,'passed',true]] as const) {
  const id=`hearing-${trial}`, directory=join(baseline,id), result=JSON.parse(await readFile(join(directory,'results.json'),'utf8'))
  const request=JSON.parse(await readFile(join(directory,`${id}-actor-${actor}-input.json`),'utf8'))
  const original=result.actors.find((a:any)=>a.id===`${id}-actor-${actor}`).result
  if (request.stage==='juror_ballot') {
   const visible=new Set(request.courtroomEvents.map((e:any)=>e.eventId))
   request.ballotContract={ initialChoice:request.courtroomAssessments.find((a:any)=>a.round==='initial')?.choice, permittedOutcomes:['guilty','not_guilty','no_verdict'], instructionEventId:original.jurors[0].instructionEventId, events:result.result.events.filter((e:any)=>visible.has(e.id)&&e.type==='juror_deliberation_turn').map((e:any)=>({eventId:e.id,exhibitIds:request.evidence.filter((item:any)=>e.sourceRefs.some((r:any)=>r.evidenceId===item.id)).map((item:any)=>item.exhibitId)})) }
   request.packet+=`\nBallot metadata contract: ${JSON.stringify(request.ballotContract)}. Put the shared permitted exhibit ID in this juror object's citations. Choose only an eligible visible deliberation event when changing position.`
  }
  jobs.push({id:`${id}-${actor}`,request,original,expected,replay,protocolUpdated:Boolean(request.ballotContract)})
 }
 const priorRun=(await readdir(root)).find(n=>n.startsWith('live-48d188c8'))
 if(priorRun){const prior=JSON.parse(await readFile(join(root,priorRun,'hearing-Rowan-25','results.json'),'utf8'));jobs.push({...structuredClone(jobs[0]),id:'captured-description-ballot-proof',original:prior.generated,expected:'failed',replay:false})}
 const positive=structuredClone(jobs[2]);positive.id='assessment-permission-positive';positive.expected='passed';positive.replay=false;positive.request.groundingContext=positive.request.groundingContext.replace(/E-001:[^\n]+/,'E-001: admitted; permitted purposes: Assess the fictional condition using the attributed disputed account.');positive.request.packet=positive.request.packet.replace(/E-001:[^\n]+/g,'E-001: admitted; permitted purposes: Assess the fictional condition using the attributed disputed account.');positive.request.packet='Fictional assessment control: assess the supplied receipt condition using the admitted disputed account; no actual law or corroboration requirement.';positive.request.courtroomEvents=[];positive.request.ballotContract=undefined;positive.original={title:'',content:'The fictional receipt condition appears met, assessed as disputed evidence within E-001’s permitted use.',citations:[],jurors:[]};jobs.push(positive)
 const files=[...(await readdir('server',{recursive:true})).filter(n=>n.endsWith('.ts')).map(n=>join('server',n)),'scripts/evaluate-jury-contract.ts','scripts/pilotEvidence.ts','package-lock.json'].sort()
 await mkdir(root,{recursive:true}); await durableJson(planPath,{authorization:'User authorizes fictional MiniMax testing without further spend approval.',runtime:process.version,jobs,sourceHashes:await Promise.all(files.map(async path=>({path,hash:hashBytes(await readFile(path))})))})
 console.log('Prepared '+jobs.length+' captured controls; five fresh requests. '+hashBytes(await readFile(planPath)))
} else {
 const encoded=await readFile(planPath,'utf8'),hash=hashBytes(encoded),plan=JSON.parse(encoded)
 if(process.version!==plan.runtime)throw Error('Runtime changed')
 for(const file of plan.sourceHashes)if(hashBytes(await readFile(file.path))!==file.hash)throw Error('Source changed: '+file.path)
 Object.assign(process.env,{MODEL_PROVIDER:'minimax',MODEL_TEMPERATURE:'0',MODEL_MAX_OUTPUT_TOKENS:'16000',MINIMAX_REASONING_EFFORT:'medium'})
 const run=join(root,`live-${hash}-${Date.now()}`);await mkdir(run,{recursive:true});await durableJson(join(run,'plan.json'),plan)
 let next=0
 await Promise.all([0,1,2].map(async()=>{while(next<plan.jobs.length){const job=plan.jobs[next++],directory=join(run,job.id);await mkdir(directory,{recursive:true})
 const transport=new DurablePilotTransport(directory,{maxCalls:500,maxInputCharacters:100000000,maxElapsedMs:3600000,requestTimeoutMs:240000});let phase='control'
 const client=new MiniMaxClient({...createMiniMaxConfig(),provider:'minimax',model:'MiniMax-M3',timeoutMs:240000,maxRetries:3},undefined,(input,init)=>{transport.setContext({caseId:job.id,phase,requestRole:String(init?.body).includes('factual-source auditor')?'checker':'author'});return transport.fetch(input,init)})
 const result:any={id:job.id,state:'started'}
 try{result.review=await client.reviewGrounding(job.request,job.original);result.expectedMatched=result.review.status===job.expected
 if(job.request.ballotContract&&result.review.status==='passed'){const draft=structuredClone(job.original);draft.grounding=result.review;result.originalMetadataErrors=validateJuryBallotContract(job.request,draft);result.normalizedOriginal=draft}
 if(job.replay){phase='fresh-protocol-updated';result.generated=await client.generateStage(job.request)}result.state='finished';console.log(job.id+': matched='+result.expectedMatched+', fresh='+Boolean(result.generated))
 }catch(error){result.state='failed';result.error=String(error);console.log(job.id+': '+String(error))}finally{result.usage=transport.usage();await durableJson(join(directory,'results.json'),result);transport.dispose()}
 }}))
 console.log('Evidence: '+run)
}
