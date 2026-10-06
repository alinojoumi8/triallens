import 'dotenv/config'
import { mkdir,readFile,readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { MiniMaxClient,createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport,durableJson,hashBytes } from './pilotEvidence'
Object.assign(process.env,{MODEL_PROVIDER:'minimax',MODEL_TEMPERATURE:'0',MODEL_MAX_OUTPUT_TOKENS:'16000',MINIMAX_REASONING_EFFORT:'medium'})
const root='tmp/qa/courtroom/jury-event-attribution'
const baseline=join('tmp/qa/courtroom/jury-contract',(await readdir('tmp/qa/courtroom/jury-contract')).find(n=>n.startsWith('live-df86'))!)
const prior=JSON.parse(await readFile(join(baseline,'plan.json'),'utf8')).jobs.find((j:any)=>j.id==='hearing-Rowan-76')
const negative=structuredClone(prior.original);negative.jurors[0].mindChangedBecause=negative.jurors[0].mindChangedBecause.replace('3164e153','deadbeef')
const full=structuredClone(prior.original);full.jurors[0].mindChangedBecause=full.jurors[0].mindChangedBecause.replace('3164e153','3164e153-f873-4b70-879f-fffadf646a1c')
const jobs=[{id:'exact-visible-event-positive',draft:prior.original,expected:'passed'},{id:'wrong-event-negative',draft:negative,expected:'failed'},{id:'full-id-positive',draft:full,expected:'passed'}]
const sourceHashes=await Promise.all([...(await readdir('server',{recursive:true})).filter(n=>n.endsWith('.ts')).map(n=>join('server',n)),'scripts/evaluate-jury-event-attribution.ts','scripts/pilotEvidence.ts','package-lock.json'].map(async path=>({path,hash:hashBytes(await readFile(path))})))
const plan={authorization:'User authorizes fictional MiniMax testing without additional spend approval.',request:prior.request,jobs,sourceHashes},hash=hashBytes(JSON.stringify(plan)),run=join(root,`live-${hash}-${Date.now()}`)
await mkdir(run,{recursive:true});await durableJson(join(run,'plan.json'),plan)
await Promise.all(jobs.map(async job=>{const directory=join(run,job.id);await mkdir(directory,{recursive:true});const transport=new DurablePilotTransport(directory,{maxCalls:50,maxInputCharacters:10000000,maxElapsedMs:1800000,requestTimeoutMs:240000});transport.setContext({caseId:job.id,requestRole:'checker',planHash:hash});const result:any={id:job.id,state:'started'}
try{const client=new MiniMaxClient({...createMiniMaxConfig(),provider:'minimax',model:'MiniMax-M3',timeoutMs:240000,maxRetries:3},undefined,transport.fetch);result.review=await client.reviewGrounding(plan.request,job.draft);result.expectedMatched=result.review.status===job.expected;result.state='finished';console.log(job.id+': matched='+result.expectedMatched)}catch(error){result.state='failed';result.error=String(error)}finally{result.usage=transport.usage();await durableJson(join(directory,'results.json'),result);transport.dispose()}}))
console.log('Evidence: '+run)
