import OpenAI from "openai"
import { DataAPIClient, DataAPIVector } from "@datastax/astra-db-ts"

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env

if (!ASTRA_DB_API_ENDPOINT) {
  throw new Error("ASTRA_DB_API_ENDPOINT is required")
}

if (!ASTRA_DB_APPLICATION_TOKEN) {
  throw new Error("ASTRA_DB_APPLICATION_TOKEN is required")
}

if (!ASTRA_DB_COLLECTION) {
  throw new Error("ASTRA_DB_COLLECTION is required")
}

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required")
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {
  token: ASTRA_DB_APPLICATION_TOKEN,
  ...(ASTRA_DB_NAMESPACE ? { keyspace: ASTRA_DB_NAMESPACE } : {}),
})

export async function POST(req: Request) {
  const body = await req.json()
  const messages = Array.isArray(body?.messages) ? body.messages : []

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const latestMessage = messages[messages.length - 1]
  const userText = typeof latestMessage === "string" ? latestMessage : latestMessage.content

  let docContext = ""

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userText,
    })

    const embedding = embeddingResponse.data?.[0]?.embedding

    if (embedding && ASTRA_DB_COLLECTION) {
      const collection = await db.collection(ASTRA_DB_COLLECTION)
      const cursor = await collection
        .find({})
        .sort({ $vector: new DataAPIVector(embedding) })
        .limit(5)
      const documents = await cursor.toArray()
      const docsMap = documents
        .map((doc) => (typeof doc === "object" && doc && "text" in doc ? (doc as { text?: string }).text : ""))
      docContext = docsMap.filter(Boolean).join("\n\n---\n\n")
    }
  } catch (error) {
    console.error("Astra DB or embedding error:", error)
    docContext = ""
  }

  const systemPrompt = `You are an AI assistant who knows everything about pet care. Use the context below when it is relevant, but do not claim the context is the source of your knowledge. If the context is not needed, answer based on your existing knowledge.\n\nCONTEXT:\n${docContext}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
      ],
      max_tokens: 500,
      temperature: 0.2,
    })

    const answer = completion.choices?.[0]?.message?.content || "Sorry, I couldn't generate an answer."

    return new Response(JSON.stringify({ text: answer }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("OpenAI chat completion error:", error)
    return new Response(JSON.stringify({ error: "OpenAI chat completion failed. Please check your API quota and key." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
