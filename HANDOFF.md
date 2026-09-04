# RAG / Vector Database Demo Build — Handoff Doc

## Why we're building this

Brad is applying for AI roles that list RAG and vector databases as required/desired skills. He needs a working demo he can show and talk about credibly in interviews. This also fills a genuine gap in his portfolio — every other project demonstrates prompt engineering, workflow automation, or UI builds, but none demonstrate retrieval-augmented generation.

The primary application target is **High Rise Financial** (US-based personal injury funding company, remote SA role, AI Systems Developer). Their spec explicitly lists RAG systems, vector databases, and prompt engineering. But RAG appears across multiple job specs Brad is targeting, so this demo has broad value.

## What we're building

**Case File Assistant** — a chat interface where a user can ask natural language questions about a library of case files and get answers grounded in the actual documents, with source citations.

### Real-world scenario it models

A personal injury funding company has hundreds of active cases, each with associated documents (medical reports, police reports, demand letters, funding agreements). Staff need to quickly answer questions like:
- "Has the Martinez client had surgery yet?"
- "Which doctor is treating the Johnson case?"
- "What's the funding amount on the Williams file?"
- "Which cases are with the law firm Henderson & Associates?"

Instead of digging through folders, they type the question and get an answer pulled from the relevant case documents.

## Architecture

```
User question
    ↓
Embed the question (API call → vector)
    ↓
Similarity search against Supabase pgvector table
    ↓
Top N matching chunks returned
    ↓
Chunks injected as context into Claude API prompt
    ↓
Claude answers based on retrieved context
    ↓
Answer displayed with source citations
```

## Stack

- **Supabase** — PostgreSQL with pgvector extension (Brad's existing stack)
- **pgvector** — vector similarity search, no separate vector DB needed
- **Embedding model** — use an embedding API to convert text → vectors (options: OpenAI `text-embedding-3-small`, or Anthropic's voyage embeddings, or a free alternative — decide at build time based on what's simplest)
- **Claude API** — for the generation step (answering based on retrieved context)
- **Vanilla HTML/JS front end** — Brad's standard build approach, no React
- **Deployment** — Vercel or local demo, whatever's fastest

## Supabase table schema

```sql
-- Enable the vector extension (one-time)
create extension if not exists vector;

-- Case documents table
create table case_documents (
  id bigserial primary key,
  case_id text not null,
  client_name text not null,
  chunk_text text not null,
  embedding vector(1536),  -- dimension depends on embedding model chosen
  metadata jsonb,          -- optional: source doc type, date, etc.
  created_at timestamptz default now()
);

-- Similarity search index
create index on case_documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 20);
```

## Similarity search function (Supabase RPC)

```sql
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id bigint,
  case_id text,
  client_name text,
  chunk_text text,
  similarity float
)
language sql stable
as $$
  select
    id,
    case_id,
    client_name,
    chunk_text,
    1 - (embedding <=> query_embedding) as similarity
  from case_documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

## Synthetic data spec

Generate **30 synthetic case files**. Each case should include:
- Client name (fictional)
- Case ID (e.g. HRF-2024-0042)
- Accident date
- Accident type (car accident, slip and fall, workplace injury, etc.)
- Injury description
- Treating doctor name
- Medical facility
- Surgery status (scheduled / completed / not required)
- Law firm representing the client
- Funding amount and status (approved / pending / disbursed)
- Case status (active / settled / in litigation)
- Brief narrative paragraph summarising the case

Each case file should be 2-4 paragraphs of realistic-sounding text. Vary the detail — some cases more complete than others, like real data.

### Chunking approach

Each case file gets split into chunks of ~200-300 words. For these short case files, each file is likely 1-2 chunks. Each chunk gets its own embedding and row in the table.

## Front end

Single HTML file. Components:
- Chat input box
- Response area showing the answer
- Source panel showing which case chunks were retrieved (case ID, client name, similarity score)
- Upload area (stretch goal — allow uploading new case docs that get chunked and embedded on the fly)

## Build sequence

1. **Set up Supabase** — enable pgvector extension, create table and RPC function
2. **Generate synthetic data** — 30 case files as JSON
3. **Embed and ingest** — script that takes each case file, chunks it, calls embedding API, stores in Supabase
4. **Build query pipeline** — function that takes a user question, embeds it, calls the Supabase RPC, returns matching chunks
5. **Build generation step** — function that takes the matching chunks, constructs a prompt with them as context, calls Claude API, returns the answer
6. **Build front end** — wire it all together in a vanilla HTML/JS interface
7. **Test with real questions** — verify it retrieves relevant chunks and gives grounded answers
8. **Screen record a demo** — for portfolio/applications

## What "done" looks like

- Ask "Has the Martinez client had surgery?" → get an answer citing the specific case chunk
- Ask "Which cases are with Henderson & Associates?" → get a list pulled from relevant chunks
- Ask "What's the total funding across active car accident cases?" → get an answer that aggregates from multiple retrieved chunks
- Source citations visible so you can verify the answer came from the data, not hallucination
- Deployable as a live demo URL or screen recording

## Brad's context for the building chat

- Brad implements JS/Python solutions via Claude Code (agentic AI) — he doesn't hand-write code
- Vanilla HTML/JS preferred for this build (single-page chat UI, no component reuse — React adds build tooling overhead for no gain). Brad is open to React where it genuinely helps, but it doesn't here
- He has an existing Supabase account and project
- He has Claude API access
- Preferred deployment: Vercel
- The build should be completable in a single focused session
- This is portfolio evidence, not a production system — pragmatic choices over perfect architecture

## Key terms Brad should be able to explain in an interview

- **Vector/Embedding**: A numerical representation of text meaning — similar text produces similar vectors
- **Similarity search**: Finding stored vectors closest to a query vector using cosine distance
- **Chunking**: Splitting documents into smaller pieces so each has a focused meaning that embeds well
- **RAG (Retrieval Augmented Generation)**: Instead of the LLM answering from training data alone, you retrieve relevant context first and inject it into the prompt so the answer is grounded in your actual documents
- **pgvector**: PostgreSQL extension that adds vector column types and similarity search — no need for a separate vector database
- **Hallucination grounding**: RAG reduces hallucination because the LLM is answering from provided context rather than memory
- **Embedding model**: The model that converts text to vectors (different from the chat/generation model)
