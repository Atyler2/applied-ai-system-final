import OpenAI from "openai"
import { DataAPIClient, DataAPIVector } from "@datastax/astra-db-ts"

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

function readEnv() {
  const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY,
  } = process.env

  const missing: string[] = []
  if (!ASTRA_DB_COLLECTION) missing.push("ASTRA_DB_COLLECTION")
  if (!ASTRA_DB_API_ENDPOINT) missing.push("ASTRA_DB_API_ENDPOINT")
  if (!ASTRA_DB_APPLICATION_TOKEN) missing.push("ASTRA_DB_APPLICATION_TOKEN")
  if (!OPENAI_API_KEY) missing.push("OPENAI_API_KEY")

  return {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY,
    missing,
  }
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()

  let body: any
  try {
    body = await req.json()
  } catch (error) {
    console.error("[chat-api] invalid-json", { requestId, error: errorMessage(error) })
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const messages = Array.isArray(body?.messages)
    ? (body.messages as Array<{ role: string; content: string }>)
    : []

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const env = readEnv()
  if (env.missing.length > 0) {
    console.error("[chat-api] missing-env", { requestId, missing: env.missing })
    return new Response(
      JSON.stringify({
        error: "Server configuration is incomplete.",
        missingVariables: env.missing,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  const client = new DataAPIClient(env.ASTRA_DB_APPLICATION_TOKEN as string)
  const db = client.db(env.ASTRA_DB_API_ENDPOINT as string, {
    token: env.ASTRA_DB_APPLICATION_TOKEN,
    ...(env.ASTRA_DB_NAMESPACE ? { keyspace: env.ASTRA_DB_NAMESPACE } : {}),
  })

  const latestMessage = messages[messages.length - 1]
  const userText = typeof latestMessage === "string" ? latestMessage : latestMessage?.content

  if (!userText || typeof userText !== "string") {
    return new Response(JSON.stringify({ error: "Latest message content is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  console.info("[chat-api] request-start", {
    requestId,
    messageCount: messages.length,
    latestMessageLength: userText.length,
  })

  let docContext = ""

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userText,
    })

    const embedding = embeddingResponse.data?.[0]?.embedding

    if (embedding && env.ASTRA_DB_COLLECTION) {
      const collection = await db.collection(env.ASTRA_DB_COLLECTION)
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
    console.warn("[chat-api] retrieval-fallback", {
      requestId,
      error: errorMessage(error),
    })
    docContext = ""
  }

  const systemPrompt = `You are an AI assistant who knows everything about pet care. Use the context below when it is relevant, but do not claim the context is the source of your knowledge. If the context is not needed, answer based on your existing knowledge.\n\nCONTEXT:\n${docContext}`

  try {
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      })),
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.2,
    })

    const answer = completion.choices?.[0]?.message?.content || "Sorry, I couldn't generate an answer."

    console.info("[chat-api] request-success", {
      requestId,
      durationMs: Date.now() - startedAt,
      usedContext: Boolean(docContext),
    })

    return new Response(JSON.stringify({ text: answer }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[chat-api] request-failed", {
      requestId,
      durationMs: Date.now() - startedAt,
      error: errorMessage(error),
    })
    return new Response(JSON.stringify({ error: "OpenAI chat completion failed. Please check your API quota and key." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
