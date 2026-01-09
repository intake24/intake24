// Report format conversion utility
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';

interface ConvertReportOptions {
  inputPath: string;
  outputPath?: string;
  outputFormat: 'csv' | 'json' | 'markdown';
  inputFormat?: 'csv' | 'json' | 'markdown';
}

interface FoodImportResult {
  foodCode: string;
  englishDescription: string;
  localDescription: string;
  operation: 'created' | 'updated' | 'skipped' | 'failed';
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface FoodImportReport {
  metadata: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    localeId: string;
    inputFile: string;
    skipExisting: boolean;
    dryRun: boolean;
    totalRows: number;
    backupTaken: boolean;
  };
  summary: {
    totalProcessed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    successRate: number;
  };
  details: FoodImportResult[];
  rollbackInfo?: {
    createdGlobalFoods: string[];
    createdLocalFoods: string[];
    originalEnabledFoods: string[];
  };
}

/**
 * Convert import report between different formats
 */
export default async function convertReportCommand(options: ConvertReportOptions): Promise<void> {
  const logger = mainLogger.child({ service: 'Report converter' });

  logger.info(`Converting report: ${options.inputPath}`);
  logger.info(`Output format: ${options.outputFormat}`);

  try {
    // Auto-detect input format if not specified
    const inputFormat = options.inputFormat || detectInputFormat(options.inputPath);
    logger.info(`Detected input format: ${inputFormat}`);

    // Generate output path if not specified
    const outputPath = options.outputPath || generateOutputPath(options.inputPath, options.outputFormat);
    logger.info(`Output path: ${outputPath}`);

    // Load and parse input report
    const report = await loadReport(options.inputPath, inputFormat);
    logger.info(`Loaded report with ${report.details.length} entries`);

    // Convert to target format
    await generateReport(report, options.outputFormat, outputPath);
    logger.info(`✅ Successfully converted report to ${options.outputFormat} format`);
    logger.info(`📄 Output saved to: ${outputPath}`);
  }
  catch (error) {
    logger.error(`Report conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Auto-detect input format based on file extension
 */
function detectInputFormat(inputPath: string): 'csv' | 'json' | 'markdown' {
  const ext = extname(inputPath).toLowerCase();

  switch (ext) {
    case '.json':
      return 'json';
    case '.csv':
      return 'csv';
    case '.md':
    case '.markdown':
      return 'markdown';
    default:
      // Default to JSON for unknown extensions
      return 'json';
  }
}

/**
 * Generate output path based on input path and target format
 */
function generateOutputPath(inputPath: string, outputFormat: 'csv' | 'json' | 'markdown'): string {
  const baseName = basename(inputPath, extname(inputPath));
  const extensions = {
    csv: '.csv',
    json: '.json',
    markdown: '.md',
  };

  return resolve(`${baseName}_converted${extensions[outputFormat]}`);
}

/**
 * Load report from file based on format
 */
async function loadReport(inputPath: string, format: 'csv' | 'json' | 'markdown'): Promise<FoodImportReport> {
  const resolvedPath = resolve(inputPath);

  switch (format) {
    case 'json':
      return loadJSONReport(resolvedPath);
    case 'csv':
      return loadCSVReport(resolvedPath);
    case 'markdown':
      throw new Error('Markdown to other format conversion not yet implemented');
    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

/**
 * Load JSON report
 */
function loadJSONReport(filePath: string): FoodImportReport {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    // Convert timestamp strings back to Date objects
    if (parsed.metadata?.startTime) {
      parsed.metadata.startTime = new Date(parsed.metadata.startTime);
    }
    if (parsed.metadata?.endTime) {
      parsed.metadata.endTime = new Date(parsed.metadata.endTime);
    }
    if (parsed.details) {
      parsed.details.forEach((detail: any) => {
        if (detail.timestamp) {
          detail.timestamp = new Date(detail.timestamp);
        }
      });
    }

    return parsed as FoodImportReport;
  }
  catch (error) {
    throw new Error(`Failed to load JSON report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load CSV report (reverse of CSV generation)
 */
function loadCSVReport(filePath: string): FoodImportReport {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // Parse CSV headers
    const headers = lines[0].split(',').map(cell => cell.replace(/"/g, '').trim());

    // Find summary section
    const summaryIndex = lines.findIndex(line => line.includes('Summary'));
    const dataLines = summaryIndex > 0 ? lines.slice(1, summaryIndex - 1) : lines.slice(1);

    // Parse data rows
    const details: FoodImportResult[] = [];
    for (const line of dataLines) {
      if (line.trim()) {
        const cells = line.split(',').map(cell => cell.replace(/"/g, '').trim());
        if (cells.length >= 7) {
          details.push({
            timestamp: new Date(cells[0]),
            foodCode: cells[1],
            englishDescription: cells[2],
            localDescription: cells[3],
            operation: cells[4] as 'created' | 'updated' | 'skipped' | 'failed',
            success: cells[5] === 'Success',
            error: cells[6] || undefined,
          });
        }
      }
    }

    // Parse summary (if available)
    const summary = {
      totalProcessed: details.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      successRate: 0,
    };

    if (summaryIndex > 0) {
      const summaryLines = lines.slice(summaryIndex + 1);
      for (const line of summaryLines) {
        const cells = line.split(',').map(cell => cell.replace(/"/g, '').trim());
        if (cells.length >= 2) {
          const key = cells[0].toLowerCase();
          const value = cells[1];

          if (key.includes('total'))
            summary.totalProcessed = Number.parseInt(value, 10) || 0;
          else if (key.includes('created'))
            summary.created = Number.parseInt(value, 10) || 0;
          else if (key.includes('updated'))
            summary.updated = Number.parseInt(value, 10) || 0;
          else if (key.includes('skipped'))
            summary.skipped = Number.parseInt(value, 10) || 0;
          else if (key.includes('failed'))
            summary.failed = Number.parseInt(value, 10) || 0;
          else if (key.includes('success'))
            summary.successRate = Number.parseFloat(value.replace('%', '')) || 0;
        }
      }
    }

    // Create minimal report structure
    const report: FoodImportReport = {
      metadata: {
        startTime: new Date(),
        localeId: 'unknown',
        inputFile: 'converted-from-csv',
        skipExisting: false,
        dryRun: false,
        totalRows: details.length,
        backupTaken: false,
      },
      summary,
      details,
    };

    return report;
  }
  catch (error) {
    throw new Error(`Failed to load CSV report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate report in target format
 */
async function generateReport(report: FoodImportReport, format: 'csv' | 'json' | 'markdown', outputPath: string): Promise<void> {
  switch (format) {
    case 'csv':
      await generateCSVReport(report, outputPath);
      break;
    case 'json':
      await generateJSONReport(report, outputPath);
      break;
    case 'markdown':
      await generateMarkdownReport(report, outputPath);
      break;
    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}

/**
 * Generate CSV report
 */
async function generateCSVReport(report: FoodImportReport, outputPath: string): Promise<void> {
  const headers = ['Timestamp', 'Food Code', 'English Description', 'Local Description', 'Operation', 'Status', 'Error'];
  const rows = [headers];

  for (const detail of report.details) {
    rows.push([
      detail.timestamp.toISOString(),
      detail.foodCode,
      detail.englishDescription,
      detail.localDescription,
      detail.operation,
      detail.success ? 'Success' : 'Failed',
      detail.error || '',
    ]);
  }

  // Add summary
  rows.push(
    [],
    ['Summary'],
    ['Total Processed', report.summary.totalProcessed.toString()],
    ['Created', report.summary.created.toString()],
    ['Updated', report.summary.updated.toString()],
    ['Skipped', report.summary.skipped.toString()],
    ['Failed', report.summary.failed.toString()],
    ['Success Rate', `${report.summary.successRate.toFixed(2)}%`],
  );

  // Add rollback info if available
  if (report.rollbackInfo) {
    rows.push(
      [],
      ['Rollback Information'],
      ['Created Global Foods', report.rollbackInfo.createdGlobalFoods.length.toString()],
      ['Created Local Foods', report.rollbackInfo.createdLocalFoods.length.toString()],
      ['Original Enabled Foods', report.rollbackInfo.originalEnabledFoods.length.toString()],
    );
  }

  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  writeFileSync(outputPath, csvContent, 'utf-8');
}

/**
 * Generate JSON report
 */
async function generateJSONReport(report: FoodImportReport, outputPath: string): Promise<void> {
  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Generate Markdown report
 */
async function generateMarkdownReport(report: FoodImportReport, outputPath: string): Promise<void> {
  const { metadata, summary, details } = report;

  let content = `# Food Import Report

## Metadata
- **Start Time**: ${metadata.startTime.toISOString()}
- **End Time**: ${metadata.endTime?.toISOString() || 'N/A'}
- **Duration**: ${metadata.duration ? `${(metadata.duration / 1000).toFixed(2)} seconds` : 'N/A'}
- **Locale**: ${metadata.localeId}
- **Input File**: ${metadata.inputFile}
- **Skip Existing**: ${metadata.skipExisting}
- **Dry Run**: ${metadata.dryRun}
- **Total Rows**: ${metadata.totalRows}
- **Backup Taken**: ${metadata.backupTaken}

## Summary
| Metric | Count | Percentage |
|--------|-------|------------|
| Total Processed | ${summary.totalProcessed} | 100% |
| Created | ${summary.created} | ${summary.totalProcessed > 0 ? ((summary.created / summary.totalProcessed) * 100).toFixed(1) : '0'}% |
| Updated | ${summary.updated} | ${summary.totalProcessed > 0 ? ((summary.updated / summary.totalProcessed) * 100).toFixed(1) : '0'}% |
| Skipped | ${summary.skipped} | ${summary.totalProcessed > 0 ? ((summary.skipped / summary.totalProcessed) * 100).toFixed(1) : '0'}% |
| Failed | ${summary.failed} | ${summary.totalProcessed > 0 ? ((summary.failed / summary.totalProcessed) * 100).toFixed(1) : '0'}% |
| **Success Rate** | **${summary.successRate.toFixed(2)}%** | - |

## Details

### Successful Operations (${details.filter(d => d.success).length})
`;

  const successful = details.filter(d => d.success);
  if (successful.length > 0) {
    content += `
| Food Code | English Description | Local Description | Operation | Timestamp |
|-----------|-------------------|-------------------|-----------|-----------|
`;
    for (const detail of successful) {
      content += `| ${detail.foodCode} | ${detail.englishDescription} | ${detail.localDescription} | ${detail.operation} | ${detail.timestamp.toISOString()} |\n`;
    }
  }
  else {
    content += '\nNo successful operations.\n';
  }

  const failed = details.filter(d => !d.success);
  if (failed.length > 0) {
    content += `
### Failed Operations (${failed.length})

| Food Code | English Description | Local Description | Error | Timestamp |
|-----------|-------------------|-------------------|-------|-----------|
`;
    for (const detail of failed) {
      content += `| ${detail.foodCode} | ${detail.englishDescription} | ${detail.localDescription} | ${detail.error || 'Unknown error'} | ${detail.timestamp.toISOString()} |\n`;
    }
  }
  else {
    content += '\n### No failed operations ✅\n';
  }

  // Add rollback information if available
  if (report.rollbackInfo) {
    content += `
## Rollback Information

**For emergency rollback, the following items were created and can be removed:**

### Created Global Foods (${report.rollbackInfo.createdGlobalFoods.length})
${report.rollbackInfo.createdGlobalFoods.length > 0
    ? report.rollbackInfo.createdGlobalFoods.map(code => `- ${code}`).join('\n')
    : 'None'
}

### Created Local Foods (${report.rollbackInfo.createdLocalFoods.length})
${report.rollbackInfo.createdLocalFoods.length > 0
    ? report.rollbackInfo.createdLocalFoods.map(code => `- ${code}`).join('\n')
    : 'None'
}

### Original Enabled Foods Count
- **Before Import**: ${report.rollbackInfo.originalEnabledFoods.length} foods
- **After Import**: ${report.rollbackInfo.originalEnabledFoods.length + summary.created + summary.updated} foods (estimated)

### Rollback Command
\`\`\`bash
pnpm cli rollback-import -r ${metadata.inputFile.replace('.csv', '-report.json')} --dry-run
\`\`\`
`;
  }

  content += `
---
*Report generated on ${new Date().toISOString()}*
`;

  writeFileSync(outputPath, content, 'utf-8');
}
