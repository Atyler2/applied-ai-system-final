import OpenAI from "openai"
import { NextRequest } from "next/server"
import { buildPawpalFacts, similarity } from "../../../lib/pawpal"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required")
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { question, owner, pet, top_k = 3 } = body

  if (!question) {
    return new Response(JSON.stringify({ error: "question is required" }), { status: 400 })
  }

  const facts = buildPawpalFacts(owner, pet)

  try {
    // create embeddings for facts in batch
    const factsResp = await client.embeddings.create({ model: "text-embedding-3-small", input: facts })
    const factEmbeddings = factsResp.data.map((d: any) => d.embedding as number[])

    const queryResp = await client.embeddings.create({ model: "text-embedding-3-small", input: question })
    const queryEmbedding = queryResp.data[0].embedding as number[]

    const scored = facts.map((f, i) => ({ fact: f, score: similarity(queryEmbedding, factEmbeddings[i]) }))
    scored.sort((a, b) => b.score - a.score)
    const topFacts = scored.slice(0, top_k).map((s) => s.fact)

    const systemPrompt = `You are an AI assistant who knows pet care. Use the context below when helpful but don't claim it's the only source.\n\nCONTEXT:\n${topFacts.join("\n\n---\n\n")}`

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.2,
    })

    const answer = completion.choices?.[0]?.message?.content || ""
    return new Response(JSON.stringify({ text: answer, facts: topFacts }), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    console.error("pawpal api error", err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
