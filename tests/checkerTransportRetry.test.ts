import { describe, expect, it } from 'vitest'
import { MiniMaxClient } from '../server/minimax'

describe('checker transport overload recovery', () => {
  it('retries the identical checker request after a transient 529', async () => {
    const bodies: string[] = []
    const client = new MiniMaxClient({ provider: 'minimax', apiKey: 'fictional-key', baseUrl: 'https://fixture.invalid/v1', model: 'fixture', timeoutMs: 10000, maxRetries: 1 }, undefined, async (_url, init) => {
      bodies.push(String(init?.body))
      if (bodies.length === 1) return new Response('overloaded', { status: 529 })
      return Response.json({ choices: [{ message: { content: JSON.stringify({ findings: [{ unitId: 'content:1', status: 'analysis', citations: [] }] }) } }] })
    })
    const review = await client.reviewGrounding({ stage: 'juror_ballot', packet: 'Fictional fixture.', evidence: [], previousTurns: '' }, { title: '', content: 'My current assessment is unchanged.', citations: [], jurors: [] })
    expect(review.status).toBe('passed')
    expect(bodies).toHaveLength(2)
    expect(bodies[1]).toBe(bodies[0])
  })
})
