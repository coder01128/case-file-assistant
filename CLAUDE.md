# Case File Assistant

## What this is

RAG (Retrieval Augmented Generation) demo. A chat interface where users ask natural language questions about a library of personal injury case files and get answers grounded in the actual documents, with source citations.

Portfolio evidence for job applications — not a production system. Pragmatic choices over perfect architecture.

## Stack

- **Supabase** — PostgreSQL with pgvector extension for vector storage and similarity search
- **OpenAI `text-embedding-3-small`** — embedding model (1536 dimensions)
- **Claude API (`claude-sonnet-4-6`)** — generation model, answers from retrieved context only
- **Vanilla HTML/JS** — single-file front end, no React, no build step
- **Vercel** — hosting + serverless function to keep API keys server-side

## Repo structure

```
case-file-assistant/
├── CLAUDE.md                 ← you are here
├── README.md                 ← employer-facing project overview
├── HANDOFF.md                ← original build spec
├── .env.example
├── .gitignore
├── index.html                ← front end (single file, all CSS/JS inline)
├── scripts/
│   ├── generate-cases.js     ← creates 30 synthetic case files → cases.json
│   └── seed-database.js      ← reads cases.json, chunks text, embeds via OpenAI, inserts into Supabase
└── api/
    └── query.js              ← Vercel serverless function (full RAG pipeline)
```

## Database (Supabase)

### Table: `case_documents`

| Column       | Type                         | Notes                                    |
|-------------|------------------------------|------------------------------------------|
| id          | bigserial primary key        |                                          |
| case_id     | text not null                | e.g. HRF-2024-0042                       |
| client_name | text not null                |                                          |
| chunk_text  | text not null                |                                          |
| embedding   | vector(1536)                 | matches text-embedding-3-small output    |
| metadata    | jsonb                        | accident_type, law_firm, doctor, status  |
| created_at  | timestamptz default now()    |                                          |

Index: `ivfflat (embedding vector_cosine_ops) with (lists = 20)`

RLS: **disabled** on this table (public demo, no auth).

### RPC function: `match_documents`

```
Parameters:
  query_embedding  vector(1536)
  match_threshold  float    default 0.7
  match_count      int      default 5

Returns: id, case_id, client_name, chunk_text, similarity (float)
```

## Query pipeline

All handled server-side by `/api/query.js`:

```
Front end sends: { question: "Has Martinez had surgery?" }
                         ↓
1. Embed the question    → OpenAI text-embedding-3-small → vector
2. Similarity search     → Supabase RPC match_documents(vector) → top 5 chunks
3. Build prompt          → system: "Answer ONLY from context below. Cite case IDs."
                           + inject chunk_text from each match
4. Generate answer       → Claude API → grounded answer with citations
5. Return to front end   → { answer: "...", sources: [{ case_id, client_name, chunk_text, similarity }] }
```

## Build constraints

- **Single-file HTML** front end. All CSS and JS inline. No JSX, no React, no bundler.
- **API keys NEVER in client-side code.** All API calls route through `/api/query.js`. The front end calls `/api/query` with a POST body containing the question. Nothing else.
- **No localStorage** — stateless chat, no conversation history persistence needed.
- **4.5:1 contrast ratio minimum** on all text, **13px minimum font size**.
- **Deploy via `git push` to main only** — Vercel GitHub integration auto-deploys. NEVER run `vercel`, `vercel dev`, `vercel --prod`, or `vercel deploy` from this repo. The CLI has historically reset Vercel project settings.
- **NEVER print or log API keys** from any script.
- **Testing** — push to main, test on the live Vercel URL. No local dev server needed for a portfolio demo.

## Environment variables (set in Vercel dashboard + local .env)

```
SUPABASE_URL=           # Project URL from Supabase dashboard → Settings → API
SUPABASE_SERVICE_KEY=   # Service role key (NOT anon key) — server-side only
OPENAI_API_KEY=         # For text-embedding-3-small
ANTHROPIC_API_KEY=      # For Claude generation
```

## What "done" looks like

- "Has the Martinez client had surgery?" → grounded answer citing the specific case chunk
- "Which cases are with Henderson & Associates?" → list pulled from matching chunks
- "What's the total funding across active car accident cases?" → aggregation from multiple chunks
- Source panel shows: case ID, client name, chunk text, similarity score
- Live on a Vercel URL that can go on the CV
