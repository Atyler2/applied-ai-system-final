# PawPal+

PawPal+ is a React and Next.js application for planning pet care tasks and asking an AI assistant about the active owner, pet, and schedule.

## Summary

- PawPal+ is a pet-care planning app with a Next.js frontend and AI assistant features. Users manage owners, pets, and tasks, then generate schedules and ask assistant questions based on active pet context. The system uses guarded API routes with logging, optional Astra retrieval, and OpenAI for responses, with safe fallback mode when AI services are unavailable. It also includes Python scheduling/domain logic and tests for core planning behavior.

## System Diagram Explanation

- The user asks a question in the Assistant UI, which sends the request to the /api/pawpal handler.
  The evaluator/guardrail layer validates the request and decides whether to continue with normal AI processing or fallback mode.
  The retriever builds context from owner/pet/task state (and optionally vector retrieval) and passes that context to the agent.
  The agent calls OpenAI to generate the final response.
  The response is returned to the user, with a fallback warning if AI services are unavailable.
  Runtime logs capture request IDs, errors, and fallback reasons.
  Testing and human review are shown as verification points to check answer quality and reliability.

## Setup and run (recommended)

1. Install Node.js 20+ and npm.

2. Configure environment variables.

```bash
cd nextjs-f1gpt
copy .env.example .env
```

Fill in real values in `.env` for OpenAI and Astra DB.

3. Install dependencies.

```bash
npm install
```

4. Validate environment and start production mode.

```bash
npm run start:safe
```

This runs an env check, builds the app, and starts the production server.

5. Open http://localhost:3000.

## Development mode

```bash
cd nextjs-f1gpt
npm run dev
```

Use development mode only when actively coding. It consumes more CPU/RAM than production mode.

## Logging and guardrails

- API routes validate input payloads and required environment variables.
- API routes log request start, success, fallback, and failure with request IDs and durations.
- If OpenAI quota is exhausted, the PawPal assistant returns a safe local fallback response instead of crashing.

## Run the Python tests

```bash
python -m pytest
```

## Design Decisions

-Earlier in the design proccess, I had decided to use Streamlit to build the frontend UI for my petpal app. However, I ran into many issues when trying to install openAI and add it to requirements. However when I switched to React it was much easier to solve this issue, with the trade off being that streamlit is much faster to set up and deploy.

## Testing Summary

What worked:

We successfully hardened the app setup with a reproducible startup flow (check:env -> build -> start).
Environment validation and production build checks ran successfully.
API guardrails and logging improvements worked as intended, giving clearer error/fallback behavior.
Diagram tasks were completed in Mermaid format, and the approval-first workflow worked once we switched to it.

What did not work:

npm start initially failed when run without the correct production sequence.
AI assistant full mode did not work because the OpenAI account hit quota/credit limits, so responses fell back to local mode.
The first architecture diagram did not match your expected style and had to be redesigned.
Early on, there was one process issue where changes were made before you explicitly approved the final diagram version.

## Sample Interactions

Example 1

- Input: "What should I do first this morning for Mochi?"
- Output: "I can still help using the current PawPal context, but full AI mode is temporarily unavailable. Relevant context: Owner available time and pending tasks are listed. Recommended next steps: prioritize high-priority and time-sensitive tasks first."

Example 2

- Input: "Do I have any tasks around 09:00, and could there be a conflict?"
- Output: "I can still help using the current PawPal context, but full AI mode is temporarily unavailable. Relevant context includes tasks with preferred times. Recommended next steps: keep completed tasks marked done so schedules stay accurate."

Example 3

- Input: "I only have 30 minutes today. What should I focus on?"
- Output: "I can still help using the current PawPal context, but full AI mode is temporarily unavailable. Recommended next steps: focus on essentials like feeding, medication, and exercise when time is limited."

Note: When OpenAI quota/billing is active, these responses come from the full model flow instead of fallback mode.
