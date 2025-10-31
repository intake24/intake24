import { createHash } from 'node:crypto';
import { logger as mainLogger } from '@intake24/common-backend';
import type { Environment } from '@intake24/common/types';
import { Database, databaseConfig } from '@intake24/db';

export type ValidateEmbeddingsArgs = {
  localeId: string;
  sampleSize?: number;
  fixErrors?: boolean;
};

export default async (cmd: ValidateEmbeddingsArgs): Promise<void> => {
  const logger = mainLogger.child({ service: 'ValidateEmbeddings' });

  const {
    localeId,
    sampleSize = 100,
    fixErrors = false,
  } = cmd;
  const expectedDimension = Number.parseInt(process.env.OPENSEARCH_EMBEDDING_DIMENSION || '768', 10);

  logger.info('Starting embedding validation', { localeId, sampleSize, fixErrors });

  // Initialize database connection
  const database = new Database({
    databaseConfig,
    logger,
    environment: (process.env.NODE_ENV || 'development') as Environment,
  });
  await database.init();

  try {
    // Simple text hash function (same as used in generation)
    const generateTextHash = (text: string): string => {
      return createHash('sha256').update(text).digest('hex');
    };

    const isEmbeddingEnabled = process.env.OPENAI_EMBEDDING_ENABLED === 'true';

    const validationResults = {
      total: 0,
      valid: 0,
      invalidFormat: 0,
      wrongDimensions: 0,
      hashMismatch: 0,
      missingFoods: 0,
      errors: [] as Array<{ type: string; foodCode: string; details: string }>,
    };

    console.log(`\n=== Validating Embeddings for ${localeId} ===`);

    // Get sample of embeddings to validate
    const embeddingsQuery = `
      SELECT 
        fe.food_code,
        fe.text_content,
        fe.embedding,
        fe.embedding_hash,
        fe.created_at,
        fe.updated_at,
        fl.name as current_food_name
      FROM food_embeddings fe
      LEFT JOIN food_locals fl ON fe.food_code = fl.food_code AND fe.locale_id = fl.locale_id
      WHERE fe.locale_id = $1
      ORDER BY RANDOM()
      LIMIT $2
    `;

    const embeddingsResult = await database.foods.query(embeddingsQuery, { replacements: [localeId, sampleSize] }) as any;
    validationResults.total = embeddingsResult[0].length;

    if (validationResults.total === 0) {
      console.log('No embeddings found for validation.');
      return;
    }

    console.log(`Validating ${validationResults.total} embeddings...`);

    for (const row of embeddingsResult[0]) {
      const { food_code, text_content, embedding, embedding_hash, current_food_name } = row;

      try {
        // 1. Check if embedding can be parsed
        let parsedEmbedding: number[];
        try {
          parsedEmbedding = JSON.parse(embedding);
        }
        catch {
          validationResults.invalidFormat++;
          validationResults.errors.push({
            type: 'INVALID_FORMAT',
            foodCode: food_code,
            details: 'Embedding cannot be parsed as JSON',
          });
          continue;
        }

        // 2. Check embedding dimensions
        if (!Array.isArray(parsedEmbedding) || parsedEmbedding.length !== expectedDimension) {
          validationResults.wrongDimensions++;
          validationResults.errors.push({
            type: 'WRONG_DIMENSIONS',
            foodCode: food_code,
            details: `Expected ${expectedDimension} dimensions, got ${Array.isArray(parsedEmbedding) ? parsedEmbedding.length : 'not array'}`,
          });
          continue;
        }

        // 3. Check if all values are numbers
        const hasInvalidValues = parsedEmbedding.some(val => typeof val !== 'number' || !Number.isFinite(val));
        if (hasInvalidValues) {
          validationResults.invalidFormat++;
          validationResults.errors.push({
            type: 'INVALID_VALUES',
            foodCode: food_code,
            details: 'Embedding contains non-numeric or infinite values',
          });
          continue;
        }

        // 4. Validate hash consistency
        if (isEmbeddingEnabled) {
          const expectedHash = generateTextHash(text_content);
          if (expectedHash !== embedding_hash) {
            validationResults.hashMismatch++;
            validationResults.errors.push({
              type: 'HASH_MISMATCH',
              foodCode: food_code,
              details: `Expected hash ${expectedHash}, got ${embedding_hash}`,
            });
          }
        }

        // 5. Check if food still exists and name matches
        if (!current_food_name) {
          validationResults.missingFoods++;
          validationResults.errors.push({
            type: 'MISSING_FOOD',
            foodCode: food_code,
            details: 'Food no longer exists in food_locals table',
          });
          continue;
        }

        // 6. Check if food name has changed significantly
        if (current_food_name !== text_content) {
          const similarity = calculateSimpleSimilarity(current_food_name, text_content);
          if (similarity < 0.8) {
            validationResults.errors.push({
              type: 'NAME_CHANGED',
              foodCode: food_code,
              details: `Food name changed: "${text_content}" -> "${current_food_name}" (similarity: ${similarity.toFixed(2)})`,
            });
          }
        }

        validationResults.valid++;
      }
      catch (error) {
        validationResults.errors.push({
          type: 'VALIDATION_ERROR',
          foodCode: food_code,
          details: error instanceof Error ? error.message : 'Unknown validation error',
        });
      }
    }

    // Display results
    console.log('\n=== Validation Results ===');
    console.log(`Total embeddings validated: ${validationResults.total}`);
    console.log(`Valid embeddings: ${validationResults.valid} (${((validationResults.valid / validationResults.total) * 100).toFixed(1)}%)`);
    console.log(`Invalid format: ${validationResults.invalidFormat}`);
    console.log(`Wrong dimensions: ${validationResults.wrongDimensions}`);
    console.log(`Hash mismatches: ${validationResults.hashMismatch}`);
    console.log(`Missing foods: ${validationResults.missingFoods}`);
    console.log(`Total issues: ${validationResults.errors.length}`);

    // Show error details
    if (validationResults.errors.length > 0) {
      console.log('\n=== Issues Found ===');

      const errorsByType = validationResults.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [type, count] of Object.entries(errorsByType)) {
        console.log(`${type}: ${count} issues`);
      }

      // Show first 10 errors
      console.log('\nFirst 10 issues:');
      for (const error of validationResults.errors.slice(0, 10)) {
        console.log(`  ${error.type}: ${error.foodCode} - ${error.details}`);
      }

      if (validationResults.errors.length > 10) {
        console.log(`  ... and ${validationResults.errors.length - 10} more issues`);
      }
    }

    // Fix errors if requested
    if (fixErrors && validationResults.errors.length > 0) {
      console.log('\n=== Fixing Errors ===');

      let fixed = 0;
      const errorsToFix = validationResults.errors.filter(e =>
        e.type === 'MISSING_FOOD' || e.type === 'INVALID_FORMAT' || e.type === 'WRONG_DIMENSIONS',
      );

      for (const error of errorsToFix) {
        try {
          if (error.type === 'MISSING_FOOD' || error.type === 'INVALID_FORMAT' || error.type === 'WRONG_DIMENSIONS') {
            // Delete invalid embeddings
            const deleteQuery = `
              DELETE FROM food_embeddings 
              WHERE food_code = $1 AND locale_id = $2
            `;
            await database.foods.query(deleteQuery, { replacements: [error.foodCode, localeId] });
            fixed++;
            console.log(`  Deleted invalid embedding for ${error.foodCode}`);
          }
        }
        catch (deleteError) {
          console.log(`  Failed to fix ${error.foodCode}: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
        }
      }

      console.log(`Fixed ${fixed} issues by removing invalid embeddings.`);

      if (fixed > 0) {
        console.log('Run the generate command to recreate missing embeddings.');
      }
    }

    // Summary recommendations
    console.log('\n=== Recommendations ===');

    const healthScore = (validationResults.valid / validationResults.total) * 100;

    if (healthScore >= 95) {
      console.log('✅ Embeddings are in excellent condition.');
    }
    else if (healthScore >= 85) {
      console.log('⚠️  Embeddings are mostly healthy but could use some cleanup.');
    }
    else {
      console.log('❌ Embeddings have significant issues and should be regenerated.');
    }

    if (validationResults.missingFoods > 0) {
      console.log(`- Remove ${validationResults.missingFoods} embeddings for deleted foods`);
    }

    if (validationResults.hashMismatch > 0) {
      console.log(`- Consider regenerating ${validationResults.hashMismatch} embeddings with hash mismatches`);
    }

    if (validationResults.invalidFormat > 0 || validationResults.wrongDimensions > 0) {
      console.log('- Remove and regenerate corrupted embeddings');
    }

    logger.info('Embedding validation completed', {
      localeId,
      total: validationResults.total,
      valid: validationResults.valid,
      issues: validationResults.errors.length,
    });
  }
  catch (error) {
    logger.error('Embedding validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      localeId,
    });
    throw error;
  }
  finally {
    await database.close();
  }
};

function calculateSimpleSimilarity(str1: string, str2: string): number {
  // Simple Jaccard similarity for name comparison
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
