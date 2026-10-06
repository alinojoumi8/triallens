import 'dotenv/config'
import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { MiniMaxClient, createMiniMaxConfig } from '../server/minimax'
import { DurablePilotTransport, durableJson, hashBytes, assertApprovedPlan } from './pilotEvidence'
const root = 'tmp/qa/courtroom/jury-repairs', planPath = root + '/plan.json'
if (!process.argv.includes('--live')) {
  const source = resolve('../jury-candidate/tmp/qa/courtroom/full-jury/live-406ba52cb9a95f6dfef0ef7ecfc1718ccb4243b09d5cf036b918389f24811358-1791136855547')
  const cases = [['hearing-Rowan',2],['hearing-Morgan',11],['later-exclusion-1',1],['conflicting-witnesses-3',8],['struck-testimony-2',10],['conflicting-witnesses-1',10],['later-exclusion-2',15],['conflicting-witnesses-2',20],['missing-essential-proof-1',5],['missing-essential-proof-3',16],['missing-essential-proof-2',30],['struck-testimony-3',27]]
  const jobs = await Promise.all(cases.map(async ([job,index]) => {
    const id = job + '-actor-' + index
    const request = JSON.parse(await readFile(join(source,String(job),id+'-input.json'),'utf8'))
    const original = JSON.parse(await readFile(join(source,String(job),'results.json'),'utf8')).actors.find((a: {id:string}) => a.id === id).result
    return {id, request, original}
  }))
  const files = [...(await readdir('server',{recursive:true})).filter(p=>p.endsWith('.ts')).map(p=>join('server',p)), 'scripts/evaluate-jury-repairs.ts','scripts/pilotEvidence.ts','package-lock.json'].sort()
  const plan = {authorization:'User authorized steps 1-3 and unlimited fictional MiniMax tests. Fresh targeted replays of the listed observed failures; not a new persisted full-hearing claim.', runtime:process.version, sourceCandidate:'406ba52cb9a95f6dfef0ef7ecfc1718ccb4243b09d5cf036b918389f24811358', settings:{model:'MiniMax-M3',temperature:0,maxOutputTokens:16000,timeoutMs:240000,maxRetries:3}, limits:{maxCalls:500,maxInputCharacters:50000000,maxElapsedMs:3600000,requestTimeoutMs:240000},jobs,candidateSourceHashes:await Promise.all(files.map(async path=>({path,sha256:hashBytes(await readFile(path,'utf8'))})))}
  await mkdir(root,{recursive:true}); await durableJson(planPath,plan)
  console.log('Prepared '+jobs.length+' targeted replays; zero calls. Hash: '+hashBytes(await readFile(planPath,'utf8')))
} else {
  const encoded=await readFile(planPath,'utf8'), planHash=process.argv.find(a=>a.startsWith('--plan-hash='))?.split('=')[1]
  assertApprovedPlan(encoded,planHash); const plan=JSON.parse(encoded)
  if(process.version!==plan.runtime)throw new Error('Runtime changed')
  for(const s of plan.candidateSourceHashes)if(hashBytes(await readFile(s.path,'utf8'))!==s.sha256)throw new Error('Source changed: '+s.path)
  Object.assign(process.env,{MODEL_PROVIDER:'minimax',MODEL_TEMPERATURE:'0',MODEL_MAX_OUTPUT_TOKENS:'16000',MINIMAX_REASONING_EFFORT:'medium'})
  const run=root+'/live-'+planHash+'-'+Date.now();await mkdir(run,{recursive:true});await durableJson(run+'/approved-plan.json',plan)
  await Promise.all(plan.jobs.map(async (job:any)=>{
    const directory=run+'/'+job.id;await mkdir(directory,{recursive:true})
    const transport=new DurablePilotTransport(directory,plan.limits)
    let role='negative-control'
    const client=new MiniMaxClient({...createMiniMaxConfig(),provider:'minimax',model:plan.settings.model,timeoutMs:plan.settings.timeoutMs,maxRetries:plan.settings.maxRetries},undefined,(input,init)=>{
      const body=JSON.parse(String(init?.body)), user=body.messages[1].content as string
      const checker=user.startsWith('Stage: factual_verification')
      transport.setContext({caseId:job.id,requestRole:checker?'checker':'author',phase:role,draftKind:user.includes('rejected the previous draft.')?'repair':'original',planHash})
      return transport.fetch(input,init)
    })
    const result:any={id:job.id,requestHash:hashBytes(JSON.stringify(job.request)),state:'started'};await durableJson(directory+'/results.json',result)
    try {
      result.originalReview=await client.reviewGrounding(job.request,job.original)
      result.originalRejected=result.originalReview.status==='failed'
      role='fresh-author-replay'
      result.generated=await client.generateStage(job.request)
      result.state='finished'
      console.log(job.id+': original rejected='+result.originalRejected+', fresh replay finished')
    } catch(error){result.state='failed';result.error=String(error);console.log(job.id+': '+String(error))}
    finally {result.usage=transport.usage();await durableJson(directory+'/results.json',result);transport.dispose()}
  }))
  console.log('Evidence: '+run)
}
