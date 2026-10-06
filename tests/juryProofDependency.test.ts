import { describe, expect, it } from 'vitest'
import { MiniMaxClient } from '../server/minimax'
import { groundingUnits } from '../server/grounding'
import { hearingCheckerCases } from '../samples/courtroom-realism/hearing-checks'
const draft={title:'Juror response',content:'E-101 attributes Mira’s handover account. I assess the receipt condition as described in that account.',citations:['E-101'],jurors:[{juror:'juror-04',leaning:'crown',confidence:61,rationale:'E-101 attributes Mira’s handover account; my vote reflects that attributed description of receipt.',citations:['E-101'],mindChangedBecause:'This initial ballot reflects my current assessment.'}]}
function run(permitted: boolean) {
 const base=hearingCheckerCases()[1].request
 const client=new MiniMaxClient({provider:'minimax',apiKey:'fictional',baseUrl:'https://fixture.invalid/v1',model:'fixture',timeoutMs:10000,maxRetries:0},undefined,async(_url,init)=>Response.json({choices:[{message:{content:JSON.stringify(String(init?.body).includes('factual-source auditor')?{findings:groundingUnits(draft as any).map(u=>({unitId:u.id,status:'analysis',citations:[{exhibitId:'E-101',paragraph:1}]}))}:draft)}}]}))
 return client.generateStage({...base,stage:'juror_ballot',packet:'Fictional receipt-condition ballot.',courtroomEvents:[],jurorProfiles:undefined,groundingRequired:true,groundingContext:permitted?'E-101: admitted; permitted purposes: Assess the fictional condition using the attributed disputed account.':'E-101: limited; permitted purposes: Accurately attribute Mira’s disputed account; not proof of contents or guilt.'})
}
describe('ballot proof dependency rather than verdict preference',()=>{
 it('withholds a Crown finding based exclusively on attribution-only descriptions even without the word proof',async()=>{await expect(run(false)).rejects.toMatchObject({grounding:{errors:expect.arrayContaining([expect.stringContaining('exclusively attribution-only')])}})})
 it('preserves a Crown assessment when the actual account is admitted for assessment',async()=>{expect((await run(true)).jurors![0].leaning).toBe('crown')})
})
