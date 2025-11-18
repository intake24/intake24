import { GoogleGenAI } from '@google/genai';
import { Client } from 'pg';
import type { SearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { FoodHeader } from '@intake24/common/types/http';
import { ensureEmbeddingColumn } from './db';
import 'dotenv/config';

// Model/backend config
const MODEL_ID = process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const EMBEDDING_COLUMN = `embedded_${MODEL_ID.replace(/\W/g, '_').toLowerCase()}`;

// Cache singletons across calls
let genAI: GoogleGenAI | null = null; // Gemini client
let dbClient: Client | null = null;
let initDone = false;
let embeddingDim = 0;

async function initOnce(): Promise<void> {
  if (initDone)
    return;

  // DB client from env or default local
  dbClient = new Client({
    host: process.env.DB_DEV_FOODS_HOST || '127.0.0.1',
    port: process.env.DB_DEV_FOODS_PORT ? Number(process.env.DB_DEV_FOODS_PORT) : 5432,
    user: process.env.DB_DEV_FOODS_USERNAME || 'postgres',
    password: (process.env.DB_DEV_FOODS_PASSWORD ?? 'postgres') as string,
    database: process.env.DB_DEV_FOODS_DATABASE || 'intake24_foods',
  });
  await dbClient.connect();

  // Init embedding backend and detect dimension using Gemini Text Embeddings
  if (!GEMINI_API_KEY)
    throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is required for Gemini models.');
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const probeResp: any = await genAI.models.embedContent({ model: MODEL_ID, contents: ['probe'] } as any);
  const embArray: number[] = probeResp?.embeddings?.[0]?.values ?? [];
  embeddingDim = embArray.length;
  if (!Number.isFinite(embeddingDim) || embeddingDim < 1)
    throw new Error(`Gemini probe dimension invalid: ${embeddingDim}`);

  await ensureEmbeddingColumn(dbClient, 'foods', EMBEDDING_COLUMN, embeddingDim);
  initDone = true;
}

async function embedText(text: string): Promise<number[]> {
  const resp: any = await genAI!.models.embedContent({ model: MODEL_ID, contents: [text] } as any);
  const vec: number[] = resp?.embeddings?.[0]?.values ?? [];
  if (!vec.length)
    throw new Error('Empty embedding from Gemini.');
  return vec;
}

export async function auxFoodSearch(parameters: SearchQueryParameters): Promise<FoodHeader[]> {
  console.log('auxFoodSearch called with parameters:', parameters);
  await initOnce();
  const { description, localeId, limit } = parameters;
  const embedding = await embedText(description);

  const result = await dbClient!.query(
    `SELECT id, code, name, ${EMBEDDING_COLUMN} <=> $1 AS distance
     FROM foods
     WHERE locale_id = $2
     ORDER BY ${EMBEDDING_COLUMN} <=> $1
     LIMIT $3`,
    [`[${embedding.join(',')}]`, localeId, limit],
  );

  // Map DB rows to FoodHeader shape; searchTerm left null, thumbnail added later in service
  const foods: FoodHeader[] = result.rows.map((r: any) => ({
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
  }));

  return foods;
}
