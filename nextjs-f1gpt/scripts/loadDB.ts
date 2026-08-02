import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import OpenAI from "openai"

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import "dotenv/config"

const { ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY } = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const f1Data = [

]

const client = new DataAPIClient({ASTRA_AB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT})
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 512 , chunkOverlap: 100 })
