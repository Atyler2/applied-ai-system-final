# PawPal+ Next.js App

## Prerequisites

- Node.js 20+
- npm 10+

## Reproducible setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
copy .env.example .env
```

3. Add values for:

- OPENAI_API_KEY
- ASTRA_DB_API_ENDPOINT
- ASTRA_DB_APPLICATION_TOKEN
- ASTRA_DB_COLLECTION
- ASTRA_DB_NAMESPACE (optional)

## Start commands

- Production-safe startup (recommended):

```bash
npm run start:safe
```

This command runs:

- `npm run check:env` to validate required variables
- `npm run build` to create a production build
- `npm start` to run the production server

- Development startup:

```bash
npm run dev
```

Use dev mode only when actively developing. It uses more CPU and RAM because of file watching and hot reload.

## API guardrails and logging

- Input payload validation for API routes
- Environment validation with clear error responses
- Structured server logs with request IDs and durations
- Safe fallback behavior when OpenAI quota/billing is unavailable

## Troubleshooting

- If assistant shows fallback mode:
  - Check OpenAI quota/billing.
  - Restart the server after updating `.env`.
- If startup fails:
  - Run `npm run check:env` and fill any missing variables.
- If performance is poor:
  - Prefer `npm run start:safe` over `npm run dev`.
  - Avoid running the project from OneDrive-synced folders when possible.
