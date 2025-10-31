import { logger as mainLogger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';
import { Database, databaseConfig } from '@intake24/db';

export type EmbeddingStatsArgs = {
  localeId?: string;
  detailed?: boolean;
};

export default async (cmd: EmbeddingStatsArgs): Promise<void> => {
  const logger = mainLogger.child({ service: 'EmbeddingStats' });

  const { localeId, detailed = false } = cmd;

  logger.info('Generating embedding statistics', { localeId, detailed });

  // Initialize database connection
  const database = new Database({
    databaseConfig,
    logger,
    environment: (process.env.NODE_ENV || 'development') as Environment,
  });
  await database.init();

  try {
    if (localeId) {
      // Stats for specific locale
      await showLocaleStats(database, localeId, detailed, logger);
    }
    else {
      // Stats for all locales
      await showGlobalStats(database, detailed, logger);
    }
  }
  catch (error) {
    logger.error('Failed to generate embedding statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      localeId,
    });
    throw error;
  }
  finally {
    await database.close();
  }
};

async function showGlobalStats(database: any, detailed: boolean, _logger: any): Promise<void> {
  // Global embedding statistics
  const globalQuery = `
    SELECT 
      COUNT(*) as total_embeddings,
      COUNT(DISTINCT locale_id) as locales_with_embeddings,
      MIN(created_at) as first_embedding,
      MAX(updated_at) as last_updated
    FROM food_embeddings
  `;

  const globalResult = await database.foods.query(globalQuery) as any;
  const globalStats = globalResult[0][0];

  console.log('\n=== Global Embedding Statistics ===');
  console.log(`Total embeddings: ${globalStats.total_embeddings}`);
  console.log(`Locales with embeddings: ${globalStats.locales_with_embeddings}`);
  console.log(`First embedding: ${globalStats.first_embedding ? new Date(globalStats.first_embedding).toISOString() : 'N/A'}`);
  console.log(`Last updated: ${globalStats.last_updated ? new Date(globalStats.last_updated).toISOString() : 'N/A'}`);

  // Per-locale breakdown
  const localeQuery = `
    SELECT 
      fe.locale_id,
      l.english_name as locale_name,
      COUNT(fe.id) as embedding_count,
      MAX(fe.updated_at) as last_updated,
      COUNT(fl.food_code) as total_foods,
      ROUND(
        (COUNT(fe.id)::float / NULLIF(COUNT(fl.food_code), 0)) * 100, 
        2
      ) as coverage_percentage
    FROM food_embeddings fe
    RIGHT JOIN locales l ON fe.locale_id = l.id
    LEFT JOIN food_locals fl ON l.id = fl.locale_id
    GROUP BY fe.locale_id, l.english_name, l.id
    ORDER BY embedding_count DESC NULLS LAST
  `;

  const localeResult = await database.foods.query(localeQuery) as any;

  console.log('\n=== Per-Locale Breakdown ===');
  console.log(`${'Locale ID'.padEnd(15) + 'Name'.padEnd(20) + 'Embeddings'.padEnd(12) + 'Total Foods'.padEnd(12) + 'Coverage'.padEnd(10)}Last Updated`);
  console.log('-'.repeat(80));

  for (const row of localeResult[0]) {
    const localeId = (row.locale_id || 'N/A').padEnd(15);
    const name = (row.locale_name || 'Unknown').padEnd(20);
    const embeddings = (row.embedding_count || '0').toString().padEnd(12);
    const totalFoods = (row.total_foods || '0').toString().padEnd(12);
    const coverage = (row.coverage_percentage ? `${row.coverage_percentage}%` : '0%').padEnd(10);
    const lastUpdated = row.last_updated ? new Date(row.last_updated).toISOString().split('T')[0] : 'Never';

    console.log(`${localeId}${name}${embeddings}${totalFoods}${coverage}${lastUpdated}`);
  }

  if (detailed) {
    // Model usage statistics
    console.log('\n=== Model Usage ===');
    const embeddingModel = process.env.OPENSEARCH_EMBEDDING_MODEL || 'cl-nagoya/ruri-v3-310m';
    const embeddingDimension = Number.parseInt(process.env.OPENSEARCH_EMBEDDING_DIMENSION || '768', 10);
    console.log(`Model: ${embeddingModel} (${embeddingDimension} dimensions)`);

    // Storage statistics
    const storageQuery = `
      SELECT 
        pg_size_pretty(pg_total_relation_size('food_embeddings')) as table_size,
        pg_size_pretty(pg_relation_size('food_embeddings')) as data_size,
        pg_size_pretty(pg_total_relation_size('food_embeddings') - pg_relation_size('food_embeddings')) as index_size
    `;

    try {
      const storageResult = await database.foods.query(storageQuery) as any;
      const storage = storageResult[0][0];

      console.log(`Total table size: ${storage.table_size}`);
      console.log(`Data size: ${storage.data_size}`);
      console.log(`Index size: ${storage.index_size}`);
    }
    catch {
      console.log('Storage statistics not available (non-PostgreSQL database)');
    }
  }
}

async function showLocaleStats(database: any, localeId: string, detailed: boolean, logger: any): Promise<void> {
  // Locale-specific statistics
  const localeQuery = `
    SELECT 
      l.english_name as locale_name,
      COUNT(fe.id) as embedding_count,
      MIN(fe.created_at) as first_embedding,
      MAX(fe.updated_at) as last_updated,
      COUNT(DISTINCT DATE(fe.created_at)) as creation_days
    FROM locales l
    LEFT JOIN food_embeddings fe ON l.id = fe.locale_id
    WHERE l.id = :localeId
    GROUP BY l.id, l.english_name
  `;

  const localeResult = await database.foods.query(localeQuery, { replacements: { localeId } }) as any;

  if (localeResult[0].length === 0) {
    console.log(`Locale '${localeId}' not found.`);
    return;
  }

  const stats = localeResult[0][0];

  console.log(`\n=== Embedding Statistics for ${localeId} ===`);
  console.log(`Locale name: ${stats.locale_name}`);
  console.log(`Total embeddings: ${stats.embedding_count || 0}`);
  console.log(`First embedding: ${stats.first_embedding ? new Date(stats.first_embedding).toISOString() : 'N/A'}`);
  console.log(`Last updated: ${stats.last_updated ? new Date(stats.last_updated).toISOString() : 'N/A'}`);
  console.log(`Generation days: ${stats.creation_days || 0}`);

  // Coverage analysis
  const coverageQuery = `
    SELECT 
      COUNT(fl.food_code) as total_foods,
      COUNT(fe.food_code) as foods_with_embeddings,
      CAST(
        (COUNT(fe.food_code)::float / NULLIF(COUNT(fl.food_code), 0)) * 100 
        AS DECIMAL(5,2)
      ) as coverage_percentage
    FROM food_locals fl
    LEFT JOIN food_embeddings fe ON fl.food_code = fe.food_code AND fl.locale_id = fe.locale_id
    WHERE fl.locale_id = :localeId
  `;

  const coverageResult = await database.foods.query(coverageQuery, { replacements: { localeId } }) as any;
  const coverage = coverageResult[0][0];

  console.log(`\n=== Coverage Analysis ===`);
  console.log(`Total foods in locale: ${coverage.total_foods}`);
  console.log(`Foods with embeddings: ${coverage.foods_with_embeddings}`);
  console.log(`Coverage: ${coverage.coverage_percentage}%`);

  if (detailed && stats.embedding_count > 0) {
    // Recent activity
    const recentQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as embeddings_created
      FROM food_embeddings
      WHERE locale_id = :localeId
      AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 10
    `;

    try {
      const recentResult = await database.foods.query(recentQuery, { replacements: { localeId } }) as any;

      if (recentResult[0].length > 0) {
        console.log(`\n=== Recent Activity (Last 30 days) ===`);
        console.log(`${'Date'.padEnd(12)}Embeddings Created`);
        console.log('-'.repeat(25));

        for (const row of recentResult[0]) {
          const date = new Date(row.date).toISOString().split('T')[0];
          console.log(`${date.padEnd(12)}${row.embeddings_created}`);
        }
      }
    }
    catch {
      // Recent activity query might not work on all database types
      logger.debug('Recent activity query failed (database type may not support intervals)');
    }

    // Sample embeddings
    const sampleQuery = `
      SELECT 
        fe.food_code,
        fe.text_content,
        fe.embedding_hash,
        fe.updated_at
      FROM food_embeddings fe
      WHERE fe.locale_id = :localeId
      ORDER BY fe.updated_at DESC
      LIMIT 5
    `;

    const sampleResult = await database.foods.query(sampleQuery, { replacements: { localeId } }) as any;

    console.log(`\n=== Sample Embeddings ===`);
    console.log(`${'Food Code'.padEnd(10) + 'Name'.padEnd(30) + 'Hash'.padEnd(16)}Updated`);
    console.log('-'.repeat(70));

    for (const row of sampleResult[0]) {
      const code = row.food_code.padEnd(10);
      const name = (row.text_content.length > 28 ? `${row.text_content.substring(0, 25)}...` : row.text_content).padEnd(30);
      const hash = row.embedding_hash.substring(0, 12).padEnd(16);
      const updated = new Date(row.updated_at).toISOString().split('T')[0];

      console.log(`${code}${name}${hash}${updated}`);
    }
  }
}
