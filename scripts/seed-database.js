import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkText(text, maxWords = 250) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const combined = current ? current + ' ' + sentence.trim() : sentence.trim();
    if (combined.split(/\s+/).length > maxWords && current) {
      chunks.push(current.trim());
      current = sentence.trim();
    } else {
      current = combined;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

async function embed(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  const casesPath = join(__dirname, 'cases.json');
  const cases = JSON.parse(readFileSync(casesPath, 'utf8'));

  let totalChunks = 0;
  let chunkCounter = 0;

  for (const c of cases) {
    const chunks = chunkText(c.narrative);
    totalChunks += chunks.length;
  }

  console.log(`Processing ${cases.length} cases (${totalChunks} total chunks)`);

  for (const c of cases) {
    try {
      const chunks = chunkText(c.narrative);

      for (const chunk of chunks) {
        chunkCounter++;
        const embedding = await embed(chunk);

        const { error } = await supabase.from('case_documents').insert({
          case_id: c.case_id,
          client_name: c.client_name,
          chunk_text: chunk,
          embedding: embedding,
          metadata: {
            accident_type: c.accident_type,
            law_firm: c.law_firm,
            treating_doctor: c.treating_doctor,
            surgery_status: c.surgery_status,
            funding_amount: c.funding_amount,
            funding_status: c.funding_status,
            case_status: c.case_status,
            medical_facility: c.medical_facility,
          },
        });

        if (error) throw error;
        console.log(`Inserted chunk ${chunkCounter}/${totalChunks} for case ${c.case_id}`);
      }
    } catch (err) {
      console.error(`Error processing case ${c.case_id}:`, err.message);
    }
  }

  console.log(`Done. ${chunkCounter} chunks inserted.`);
}

main();
