import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body || {};

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question.trim(),
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data: chunks, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 5,
    });

    if (matchError) {
      throw new Error(`Supabase match error: ${matchError.message}`);
    }

    const seen = new Map();
    for (const c of chunks || []) {
      if (!seen.has(c.case_id) || c.similarity > seen.get(c.case_id).similarity) {
        seen.set(c.case_id, c);
      }
    }
    const dedupedChunks = [...seen.values()];

    const hasResults = dedupedChunks.length > 0;

    let contextBlock = '';
    if (hasResults) {
      contextBlock = dedupedChunks
        .map(
          (c) =>
            `--- CASE FILE EXCERPT ---\nCase ID: ${c.case_id}\nClient: ${c.client_name}\nContent: ${c.chunk_text}\n---`
        )
        .join('\n\n');
    } else {
      contextBlock = '(No matching case file excerpts were found for this query.)';
    }

    const systemPrompt = `You are a case file assistant for a personal injury funding company. Answer the user's question using ONLY the case file excerpts provided below. Cite the case ID (e.g. HRF-2024-0042) for every claim. If the provided excerpts do not contain enough information to answer, say so — do not guess or use outside knowledge. If the question asks for numerical aggregation, show your working.

${contextBlock}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: question.trim() }],
    });

    const answer = message.content[0].text;

    const sources = hasResults
      ? dedupedChunks.map((c) => ({
          case_id: c.case_id,
          client_name: c.client_name,
          chunk_text: c.chunk_text,
          similarity: c.similarity,
        }))
      : [];

    return res.status(200).json({ answer, sources });
  } catch (err) {
    console.error('Query pipeline error:', err.message);
    return res.status(500).json({ error: 'Failed to process query. Please try again.' });
  }
}
