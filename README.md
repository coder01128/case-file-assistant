# Case File Assistant

A retrieval-augmented generation (RAG) system that lets users ask natural language questions about a library of case files and receive answers grounded in the actual documents, with source citations.

Built to model a real business scenario: a personal injury funding company with hundreds of active cases. Instead of manually searching through folders, staff type a question and get an answer pulled from the relevant case documents — with full traceability back to the source.

## Architecture

```
User question
     │
     ▼
┌─────────────────────┐
│  Embed the question  │  ← OpenAI text-embedding-3-small
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Similarity search   │  ← Supabase pgvector (cosine distance)
│  against case chunks │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Inject top chunks   │
│  as prompt context   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Claude generates    │  ← Answers ONLY from retrieved context
│  grounded answer     │
│  with source cites   │
└─────────────────────┘
```

## Tech stack

| Layer              | Technology                                                  |
|-------------------|-------------------------------------------------------------|
| Vector storage     | Supabase PostgreSQL + pgvector extension                    |
| Embedding model    | OpenAI `text-embedding-3-small` (1536 dimensions)           |
| Generation model   | Anthropic Claude API                                        |
| Similarity search  | Supabase RPC function using cosine distance                 |
| Front end          | Vanilla HTML/JS (single file, no build step)                |
| API layer          | Vercel serverless function (keeps API keys server-side)     |
| Deployment         | Vercel via GitHub integration                               |

## What this demonstrates

- **RAG pipeline** — full retrieval-augmented generation from document ingestion through to cited answers
- **Vector database** — pgvector for similarity search within PostgreSQL (no separate vector DB infrastructure)
- **Embedding + generation** — two distinct model roles: OpenAI for semantic encoding, Claude for grounded generation
- **Chunking strategy** — document splitting for optimal embedding quality
- **Source grounding** — every answer is traceable to specific document chunks, reducing hallucination
- **Prompt engineering** — system prompts that constrain the model to answer only from retrieved context

## Setup and deployment

1. Clone the repo:
   ```
   git clone https://github.com/coder01128/case-file-assistant.git
   cd case-file-assistant
   ```

2. Connect the repo to a Vercel project via the [Vercel dashboard](https://vercel.com) (import from GitHub). Set the four environment variables from `.env.example` in the project's Settings → Environment Variables.

3. Seed the database — copy `.env.example` to `.env`, fill in your keys, then run:
   ```
   npm install
   node scripts/generate-cases.js        # creates scripts/cases.json (30 synthetic case files)
   node scripts/seed-database.js          # chunks, embeds, and inserts into Supabase
   ```

4. Push to `main` to deploy:
   ```
   git push origin main
   ```
   Vercel's GitHub integration auto-deploys. The live URL appears in the Vercel dashboard.

> **Note:** Do not use the Vercel CLI (`vercel`, `vercel dev`, `vercel deploy`) — deploy via `git push` only. The CLI has historically reset project settings.

## Example queries

| Question                                               | What it tests                              |
|-------------------------------------------------------|--------------------------------------------|
| "Has the Martinez client had surgery?"                 | Single-case fact retrieval                  |
| "Which cases are with Henderson & Associates?"         | Cross-case filtering by entity             |
| "What's the total funding across active car accidents?"| Multi-chunk aggregation                    |
| "Which doctor is treating the Johnson case?"           | Specific field extraction                  |

## Repo structure

```
├── index.html                ← front end (single file)
├── api/
│   └── query.js              ← Vercel serverless function (RAG pipeline)
├── scripts/
│   ├── generate-cases.js     ← synthetic case data generator
│   └── seed-database.js      ← embed + ingest into Supabase
├── CLAUDE.md                 ← build context for Claude Code sessions
├── HANDOFF.md                ← original build specification
└── .env.example              ← environment variable template
```
