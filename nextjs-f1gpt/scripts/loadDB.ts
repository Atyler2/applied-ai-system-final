import { DataAPIClient } from "@datastax/astra-db-ts"
import OpenAI from "openai"
import puppeteer from "puppeteer"

import "dotenv/config"

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env

if (!ASTRA_DB_API_ENDPOINT) {
  throw new Error("ASTRA_DB_API_ENDPOINT is required in .env")
}

if (!ASTRA_DB_APPLICATION_TOKEN) {
  throw new Error("ASTRA_DB_APPLICATION_TOKEN is required in .env")
}

if (!ASTRA_DB_COLLECTION) {
  throw new Error("ASTRA_DB_COLLECTION is required in .env")
}

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required in .env")
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {
  token: ASTRA_DB_APPLICATION_TOKEN,
  ...(ASTRA_DB_NAMESPACE ? { keyspace: ASTRA_DB_NAMESPACE } : {}),
})
const collection = db.collection(ASTRA_DB_COLLECTION)

const f1Data: string[] = [
    "https://www.aspca.org/pet-care/dog-care/general-dog-care",
    "https://www.aspca.org/pet-care/cat-care/general-cat-care",
    "https://www.aspca.org/pet-care/horse-care"
  // Add URLs or file paths to ingest here.
  // Example: "https://example.com/pet-care-guide"
]

const chunkText = (text: string, chunkSize = 1000): string[] => {
  const chunks: string[] = []
  let offset = 0
  while (offset < text.length) {
    chunks.push(text.slice(offset, offset + chunkSize).trim())
    offset += chunkSize
  }
  return chunks.filter(Boolean)
}

const scrapePage = async (url: string): Promise<string> => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: "domcontentloaded" })
  const content = await page.evaluate(() => document.body.innerText || "")
  await browser.close()
  return content.replace(/,[\n]+/g, " ")
}

const createCollectionIfMissing = async () => {
  try {
    console.log(`Creating collection ${ASTRA_DB_COLLECTION}`)
    await db.createCollection(ASTRA_DB_COLLECTION, {
      defaultId: { type: "uuid" },
    })
    console.log("Collection created")
  } catch (error) {
    const message = String((error as Error)?.message || error)
    if (message.toLowerCase().includes("already exists")) {
      console.log("Collection already exists, continuing...")
    } else {
      throw error
    }
  }
}

const loadSampleData = async () => {
  if (f1Data.length === 0) {
    console.log("No source URLs defined in f1Data. Add URLs to ingest in scripts/loadDB.ts.")
    return
  }

  for (const url of f1Data) {
    console.log(`Scraping ${url}`)
    const content = await scrapePage(url)
    const chunks = chunkText(content)

    for (const chunk of chunks) {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: chunk,
      })

      const vector = response.data[0].embedding
      const result = await collection.insertOne({
        url,
        text: chunk,
        embedding: vector,
      })
      console.log(`Inserted document ${result.insertedId}`)
    }
  }
}

const main = async () => {
  await createCollectionIfMissing()
  await loadSampleData()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
