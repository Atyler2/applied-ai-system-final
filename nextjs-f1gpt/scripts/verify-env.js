const fs = require("fs")
const path = require("path")

try {
  require("dotenv").config({ path: path.join(process.cwd(), ".env") })
} catch (error) {
  console.error("[env-check] Failed to load dotenv:", error)
  process.exit(1)
}

const required = [
  "OPENAI_API_KEY",
  "ASTRA_DB_API_ENDPOINT",
  "ASTRA_DB_APPLICATION_TOKEN",
  "ASTRA_DB_COLLECTION",
]

const optional = ["ASTRA_DB_NAMESPACE"]

const missingRequired = required.filter((name) => !process.env[name] || !String(process.env[name]).trim())
const missingOptional = optional.filter((name) => !process.env[name] || !String(process.env[name]).trim())

const envPath = path.join(process.cwd(), ".env")
const hasEnvFile = fs.existsSync(envPath)

console.log("[env-check] Working directory:", process.cwd())
console.log("[env-check] .env file:", hasEnvFile ? "found" : "missing")

if (missingRequired.length > 0) {
  console.error("[env-check] Missing required environment variables:")
  for (const name of missingRequired) {
    console.error(`- ${name}`)
  }
  console.error("[env-check] Copy .env.example to .env and fill in values.")
  process.exit(1)
}

console.log("[env-check] Required environment variables are present.")

if (missingOptional.length > 0) {
  console.warn("[env-check] Optional variables not set:")
  for (const name of missingOptional) {
    console.warn(`- ${name}`)
  }
}

console.log("[env-check] Environment validation complete.")
