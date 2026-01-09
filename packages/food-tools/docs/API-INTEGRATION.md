# API Integration Guide

This guide explains how to use @intake24/food-tools programmatically in your own applications.

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Command APIs](#command-apis)
4. [Advanced Integration](#advanced-integration)
5. [Custom Implementations](#custom-implementations)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

## Installation

### NPM/Yarn/PNPM

```bash
# Using pnpm (recommended)
pnpm add @intake24/food-tools

# Using npm
npm install @intake24/food-tools

# Using yarn
yarn add @intake24/food-tools
```

### TypeScript Support

The package includes TypeScript definitions. No additional @types package needed.

```typescript
import {
  importFoodsCommand,
  type FoodImportOptions
} from '@intake24/food-tools';
```

## Basic Usage

### Environment Configuration

Set required environment variables:

```typescript
// .env or process.env
process.env.API_V4_URL = 'https://api.intake24.com';
process.env.API_V4_ACCESS_TOKEN = 'your-admin-token';
```

### Simple Import Example

```typescript
import { importFoodsCommand } from '@intake24/food-tools';

async function importFoods() {
  try {
    const result = await importFoodsCommand({
      inputPath: './foods.csv',
      localeId: 'en_GB',
      dryRun: false,
      batchSize: 10,
      skipHeaderRows: 1,
      tags: ['imported'],
      defaultFoodGroup: '1',
    });

    console.log('Import completed:', result);
  } catch (error) {
    console.error('Import failed:', error);
  }
}
```

## Command APIs

### Import Foods Command

```typescript
import { importFoodsCommand } from '@intake24/food-tools';

interface FoodImportOptions {
  inputPath: string;              // Path to CSV file
  localeId: string;               // Target locale (e.g., 'en_GB')
  dryRun?: boolean;               // Preview without importing
  batchSize?: number;             // API batch size (default: 10)
  skipHeaderRows?: number;        // CSV header rows to skip
  tags?: string[];                // Tags to add to foods
  defaultFoodGroup?: string;      // Default group ID
  nutrientTableMapping?: Record<string, string>;
  skipExisting?: boolean;         // Skip existing foods
  skipInvalidNutrients?: boolean; // Skip invalid nutrients
  reportPath?: string;            // Save report to file
  reportFormat?: 'json' | 'csv' | 'markdown';
}

// Usage with preset
const result = await importFoodsCommand({
  inputPath: './japan-foods.csv',
  localeId: 'jp_JP_2024',
  preset: 'japan', // Uses Japan-specific settings
});
```

### Sync Foods Command

```typescript
import { syncFoodsCommand } from '@intake24/food-tools';

interface SyncFoodsOptions {
  inputPath: string;         // CSV file path
  localeId: string;          // Target locale
  dryRun?: boolean;          // Preview changes
  reportPath?: string;       // Report file path
  skipHeaderRows?: number;   // Header rows to skip
  forceUpdate?: boolean;     // Update minor differences
  enableAll?: boolean;       // Enable all CSV foods
}

// Keep database synchronized with CSV
const syncResult = await syncFoodsCommand({
  inputPath: './foods-master.csv',
  localeId: 'en_GB',
  enableAll: true,
  reportPath: './sync-report.json',
});
```

### Verify Consistency Command

```typescript
import { verifyConsistencyCommand } from '@intake24/food-tools';

interface ConsistencyCheckOptions {
  inputPath: string;
  localeId: string;
  reportPath?: string;
  reportFormat?: 'json' | 'csv' | 'markdown';
  skipHeaderRows?: number;
  checkCategories?: boolean;
  checkNames?: boolean;
  includeValidRows?: boolean;
}

// Check if database matches CSV
const consistency = await verifyConsistencyCommand({
  inputPath: './foods.csv',
  localeId: 'en_GB',
  reportPath: './consistency-check.json',
});
```

### Validate Nutrients Command

```typescript
import { validateNutrientsBatchCommand } from '@intake24/food-tools';

// Validate all nutrient mappings before import
const validation = await validateNutrientsBatchCommand({
  inputPath: './foods.csv',
  localeId: 'en_GB',
  skipHeaderRows: 1,
  reportPath: './validation-report.json',
});
```

### Other Commands

```typescript
import {
  checkNutrientsCommand,
  crossCheckImportCommand,
  rollbackImportCommand,
  convertReportCommand,
} from '@intake24/food-tools';

// Check single nutrient record
await checkNutrientsCommand({
  table: 'NDNS',
  recordId: '1234',
  dryRun: true,
});

// Cross-check import results
await crossCheckImportCommand({
  csvPath: './original.csv',
  reportPath: './import-report.json',
  localeId: 'en_GB',
  outputPath: './cross-check.json',
});

// Rollback failed import
await rollbackImportCommand({
  reportPath: './failed-import.json',
  dryRun: false,
});

// Convert report format
await convertReportCommand({
  inputPath: './report.json',
  outputFormat: 'csv',
  outputPath: './report.csv',
});
```

## Advanced Integration

### Custom Error Handling

```typescript
import { importFoodsCommand } from '@intake24/food-tools';

class FoodImporter {
  async importWithRetry(options: FoodImportOptions, maxRetries = 3) {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await importFoodsCommand(options);
      } catch (error) {
        lastError = error as Error;

        // Don't retry validation errors
        if (error.message.includes('validation')) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw lastError!;
  }
}
```

### Progress Monitoring

```typescript
import { EventEmitter } from 'events';

class ImportMonitor extends EventEmitter {
  async importWithProgress(options: FoodImportOptions) {
    const startTime = Date.now();
    let processed = 0;

    // Mock progress tracking (real implementation would hook into command)
    const interval = setInterval(() => {
      processed += 10;
      this.emit('progress', {
        processed,
        elapsed: Date.now() - startTime,
      });
    }, 1000);

    try {
      const result = await importFoodsCommand(options);
      clearInterval(interval);
      this.emit('complete', result);
      return result;
    } catch (error) {
      clearInterval(interval);
      this.emit('error', error);
      throw error;
    }
  }
}

// Usage
const monitor = new ImportMonitor();

monitor.on('progress', ({ processed, elapsed }) => {
  console.log(`Processed: ${processed} foods in ${elapsed}ms`);
});

monitor.on('complete', (result) => {
  console.log('Import complete:', result.summary);
});

await monitor.importWithProgress(options);
```

### Batch Processing Multiple Files

```typescript
import { glob } from 'glob';
import { importFoodsCommand } from '@intake24/food-tools';

async function importMultipleFiles(pattern: string, localeId: string) {
  const files = await glob(pattern);
  const results = [];

  for (const file of files) {
    console.log(`Importing ${file}...`);

    try {
      const result = await importFoodsCommand({
        inputPath: file,
        localeId,
        skipExisting: true,
        reportPath: `./reports/${path.basename(file)}.json`,
      });

      results.push({
        file,
        success: true,
        summary: result.summary,
      });
    } catch (error) {
      results.push({
        file,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

// Import all CSV files in a directory
const results = await importMultipleFiles('./imports/*.csv', 'en_GB');
```

## Custom Implementations

### Custom CSV Parser

```typescript
import { parse } from 'csv-parse';
import { importFoodsCommand } from '@intake24/food-tools';

class CustomImporter {
  async importWithTransform(csvPath: string, transform: (row: any) => any) {
    // Read and transform CSV
    const transformedPath = './transformed.csv';
    const input = createReadStream(csvPath);
    const output = createWriteStream(transformedPath);

    const parser = parse({ columns: true });
    const stringifier = stringify({ header: true });

    input
      .pipe(parser)
      .on('data', (row) => {
        const transformed = transform(row);
        stringifier.write(transformed);
      })
      .on('end', () => {
        stringifier.end();
      });

    stringifier.pipe(output);

    // Wait for transformation to complete
    await new Promise(resolve => output.on('finish', resolve));

    // Import transformed file
    return importFoodsCommand({
      inputPath: transformedPath,
      localeId: 'en_GB',
    });
  }
}
```

### Integration with Express API

```typescript
import express from 'express';
import multer from 'multer';
import { importFoodsCommand, verifyConsistencyCommand } from '@intake24/food-tools';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/import-foods', upload.single('csv'), async (req, res) => {
  try {
    const { localeId, dryRun } = req.body;

    // Validate input
    if (!req.file || !localeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Run import
    const result = await importFoodsCommand({
      inputPath: req.file.path,
      localeId,
      dryRun: dryRun === 'true',
      reportPath: `./reports/${req.file.filename}.json`,
    });

    res.json({
      success: true,
      summary: result.summary,
      reportPath: result.reportPath,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/verify-consistency/:localeId', async (req, res) => {
  try {
    const { localeId } = req.params;
    const { csvPath } = req.query;

    const result = await verifyConsistencyCommand({
      inputPath: csvPath as string,
      localeId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Scheduled Sync Job

```typescript
import { CronJob } from 'cron';
import { syncFoodsCommand } from '@intake24/food-tools';
import { sendEmail } from './email-service';

class FoodSyncScheduler {
  private job: CronJob;

  constructor() {
    // Run daily at 2 AM
    this.job = new CronJob('0 2 * * *', async () => {
      await this.syncFoods();
    });
  }

  async syncFoods() {
    const locales = ['en_GB', 'jp_JP_2024', 'fr_FR'];
    const results = [];

    for (const localeId of locales) {
      try {
        const result = await syncFoodsCommand({
          inputPath: `./master-data/${localeId}.csv`,
          localeId,
          enableAll: true,
          reportPath: `./sync-reports/${localeId}-${Date.now()}.json`,
        });

        results.push({
          localeId,
          success: true,
          summary: result.summary,
        });
      } catch (error) {
        results.push({
          localeId,
          success: false,
          error: error.message,
        });
      }
    }

    // Send summary email
    await sendEmail({
      to: 'admin@example.com',
      subject: 'Daily Food Sync Report',
      body: this.formatReport(results),
    });
  }

  start() {
    this.job.start();
  }

  stop() {
    this.job.stop();
  }
}
```

## Error Handling

### Error Types

```typescript
// Custom error types you might encounter
class ValidationError extends Error {
  constructor(public details: any) {
    super('Validation failed');
  }
}

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

class CsvParseError extends Error {
  constructor(public line: number, message: string) {
    super(`Line ${line}: ${message}`);
  }
}
```

### Comprehensive Error Handling

```typescript
import { importFoodsCommand } from '@intake24/food-tools';

async function safeImport(options: FoodImportOptions) {
  try {
    return await importFoodsCommand(options);
  } catch (error) {
    if (error.message.includes('401')) {
      throw new Error('Authentication failed. Check API token.');
    }

    if (error.message.includes('429')) {
      throw new Error('Rate limit exceeded. Try reducing batch size.');
    }

    if (error.message.includes('CSV')) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }

    if (error.message.includes('nutrient')) {
      console.warn('Nutrient validation issues detected');
      // Retry with skip flag
      return await importFoodsCommand({
        ...options,
        skipInvalidNutrients: true,
      });
    }

    // Unknown error
    throw error;
  }
}
```

## Examples

### Complete Import Pipeline

```typescript
import {
  validateNutrientsBatchCommand,
  importFoodsCommand,
  verifyConsistencyCommand,
  syncFoodsCommand,
} from '@intake24/food-tools';

class FoodImportPipeline {
  async runComplete(csvPath: string, localeId: string) {
    const reports = {
      validation: null,
      import: null,
      consistency: null,
      sync: null,
    };

    try {
      // Step 1: Validate nutrients
      console.log('Step 1: Validating nutrients...');
      reports.validation = await validateNutrientsBatchCommand({
        inputPath: csvPath,
        localeId,
        reportPath: `./reports/${localeId}-validation.json`,
      });

      // Step 2: Import foods
      console.log('Step 2: Importing foods...');
      reports.import = await importFoodsCommand({
        inputPath: csvPath,
        localeId,
        skipInvalidNutrients: true,
        reportPath: `./reports/${localeId}-import.json`,
      });

      // Step 3: Verify consistency
      console.log('Step 3: Verifying consistency...');
      reports.consistency = await verifyConsistencyCommand({
        inputPath: csvPath,
        localeId,
        reportPath: `./reports/${localeId}-consistency.json`,
      });

      // Step 4: Sync if needed
      if (reports.consistency.summary.mismatches > 0) {
        console.log('Step 4: Syncing foods...');
        reports.sync = await syncFoodsCommand({
          inputPath: csvPath,
          localeId,
          enableAll: true,
          reportPath: `./reports/${localeId}-sync.json`,
        });
      }

      return {
        success: true,
        reports,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        reports,
      };
    }
  }
}

// Usage
const pipeline = new FoodImportPipeline();
const result = await pipeline.runComplete('./foods.csv', 'en_GB');
```

### Multi-Locale Management

```typescript
import { importFoodsCommand } from '@intake24/food-tools';

class MultiLocaleManager {
  private localeConfigs = {
    'en_GB': { preset: 'uk', tags: ['british'] },
    'en_US': { preset: 'usa', tags: ['american'] },
    'jp_JP_2024': { preset: 'japan', tags: ['japanese'] },
    'fr_FR': { preset: 'france', tags: ['french'] },
  };

  async importToMultipleLocales(csvPath: string, localeIds: string[]) {
    const results = new Map();

    for (const localeId of localeIds) {
      const config = this.localeConfigs[localeId] || { preset: 'custom', tags: [] };

      try {
        const result = await importFoodsCommand({
          inputPath: csvPath,
          localeId,
          ...config,
          reportPath: `./reports/${localeId}-import.json`,
        });

        results.set(localeId, { success: true, summary: result.summary });
      } catch (error) {
        results.set(localeId, { success: false, error: error.message });
      }
    }

    return results;
  }
}
```
