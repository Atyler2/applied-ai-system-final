import OpenAI from "openai"
import { NextRequest } from "next/server"
import { buildPawpalFacts, similarity } from "../../../lib/pawpal"

function keywordTopFacts(question: string, facts: string[], topK: number) {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)

  const scored = facts.map((fact) => {
    const lowerFact = fact.toLowerCase()
    const score = words.reduce((sum, word) => (lowerFact.includes(word) ? sum + 1 : sum), 0)
    return { fact, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, Math.max(1, topK)).map((item) => item.fact)
}

function fallbackResponse(question: string, topFacts: string[], warning: string) {
  const guidance = [
    "Prioritize high-priority and time-sensitive tasks first.",
    "Keep completed tasks marked done so schedules stay accurate.",
    "If time is limited, focus on essentials like feeding, medication, and exercise.",
  ]

  const factSummary = topFacts.length ? topFacts.map((fact) => `- ${fact}`).join("\n") : "- No stored facts available."
  const text = `I can still help using the current PawPal context, but full AI mode is temporarily unavailable.\n\nRelevant context:\n${factSummary}\n\nRecommended next steps:\n${guidance.join("\n")}`
  return { text, facts: topFacts, warning, question }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()

  let body: any
  try {
    body = await req.json()
  } catch (error) {
    console.error("[pawpal-api] invalid-json", {
      requestId,
      error: errorMessage(error),
    })
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400 })
  }

  const { question, owner, pet, top_k = 3 } = body || {}
  const topK = Math.min(10, Math.max(1, Number(top_k) || 3))

  if (!question || typeof question !== "string") {
    return new Response(JSON.stringify({ error: "question is required" }), { status: 400 })
  }

  if (!owner || !pet) {
    return new Response(JSON.stringify({ error: "owner and pet are required" }), { status: 400 })
  }

  const facts = buildPawpalFacts(owner, pet)
  const lexicalFacts = keywordTopFacts(question, facts, topK)

  const openAiApiKey = process.env.OPENAI_API_KEY

  console.info("[pawpal-api] request-start", {
    requestId,
    questionLength: question.length,
    factCount: facts.length,
    topK,
  })

  if (!openAiApiKey) {
    console.warn("[pawpal-api] missing-openai-key", { requestId })
    return new Response(
      JSON.stringify(
        fallbackResponse(question, lexicalFacts, "OPENAI_API_KEY is not configured. Running in local fallback mode.")
      ),
      { headers: { "Content-Type": "application/json" } }
    )
  }

  const client = new OpenAI({ apiKey: openAiApiKey })

  try {
    let topFacts = lexicalFacts

    // create embeddings for facts in batch
    try {
      const factsResp = await client.embeddings.create({ model: "text-embedding-3-small", input: facts })
      const factEmbeddings = factsResp.data.map((d: any) => d.embedding as number[])

      const queryResp = await client.embeddings.create({ model: "text-embedding-3-small", input: question })
      const queryEmbedding = queryResp.data[0].embedding as number[]

      const scored = facts.map((f, i) => ({ fact: f, score: similarity(queryEmbedding, factEmbeddings[i]) }))
      scored.sort((a, b) => b.score - a.score)
      topFacts = scored.slice(0, topK).map((s) => s.fact)
    } catch (error) {
      console.warn("[pawpal-api] embedding-fallback", {
        requestId,
        error: errorMessage(error),
      })
      topFacts = lexicalFacts
    }

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
    console.info("[pawpal-api] request-success", {
      requestId,
      durationMs: Date.now() - startedAt,
      topFactsCount: topFacts.length,
    })
    return new Response(JSON.stringify({ text: answer, facts: topFacts }), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    console.error("[pawpal-api] request-fallback", {
      requestId,
      durationMs: Date.now() - startedAt,
      error: errorMessage(err),
    })
    const fallback = fallbackResponse(
      question,
      lexicalFacts,
      "OpenAI quota or request failed. Running in local fallback mode."
    )
    return new Response(JSON.stringify(fallback), { headers: { "Content-Type": "application/json" } })
  }
}
