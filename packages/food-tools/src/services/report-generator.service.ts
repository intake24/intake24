/**
 * Report generation service for food import/validation operations
 */

import { writeFileSync } from 'node:fs';

export type ReportFormat = 'csv' | 'json' | 'markdown';

/**
 * Base report metadata
 */
export interface ReportMetadata {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  localeId?: string;
  inputFile?: string;
  skipExisting?: boolean;
  dryRun?: boolean;
  totalRows?: number;
  backupTaken?: boolean;
  [key: string]: unknown;
}

/**
 * Base report summary
 */
export interface ReportSummary {
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  successRate: number;
  [key: string]: unknown;
}

/**
 * Generic operation result detail
 */
export interface OperationDetail {
  timestamp: Date;
  foodCode: string;
  englishDescription: string;
  localDescription: string;
  operation: string;
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Associated food issue
 */
export interface AssociatedFoodIssue {
  foodCode?: string;
  associatedCode: string;
  reason: string;
  isLookupFailure: boolean;
}

/**
 * Generic report structure
 */
export interface Report<M extends ReportMetadata = ReportMetadata, S extends ReportSummary = ReportSummary, D extends OperationDetail = OperationDetail> {
  metadata: M;
  summary: S;
  details: D[];
  associatedFoodIssues?: AssociatedFoodIssue[];
  deletedLocalFoods?: Array<{ code: string; name: string }>;
  rollbackInfo?: {
    createdGlobalFoods: string[];
    createdLocalFoods: string[];
    originalEnabledFoods: string[];
  };
  [key: string]: unknown;
}

/**
 * ReportGeneratorService provides utilities for generating reports in various formats
 */
export class ReportGeneratorService {
  /**
   * Generate a report in the specified format
   */
  async generate<R extends Report>(
    report: R,
    format: ReportFormat,
    outputPath: string,
  ): Promise<void> {
    switch (format) {
      case 'csv':
        await this.generateCSVReport(report, outputPath);
        break;
      case 'json':
        await this.generateJSONReport(report, outputPath);
        break;
      case 'markdown':
        await this.generateMarkdownReport(report, outputPath);
        break;
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport<R extends Report>(report: R, outputPath: string): Promise<void> {
    const headers = ['Timestamp', 'Food Code', 'English Description', 'Local Description', 'Operation', 'Status', 'Error'];
    const rows: string[][] = [headers];

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

    // Add summary section
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

    // Add deleted local foods if present
    if (report.deletedLocalFoods && report.deletedLocalFoods.length > 0) {
      rows.push(
        [],
        ['Deleted Local Foods'],
        ['Code', 'Name'],
      );
      for (const food of report.deletedLocalFoods) {
        rows.push([food.code, food.name]);
      }
    }

    const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    writeFileSync(outputPath, csvContent, 'utf-8');
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport<R extends Report>(report: R, outputPath: string): Promise<void> {
    writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport<R extends Report>(report: R, outputPath: string): Promise<void> {
    const { metadata, summary, details } = report;

    let content = `# Food Import Report

## Metadata
- **Start Time**: ${metadata.startTime.toISOString()}
- **End Time**: ${metadata.endTime?.toISOString() || 'N/A'}
- **Duration**: ${metadata.duration ? `${(metadata.duration / 1000).toFixed(2)} seconds` : 'N/A'}
- **Locale**: ${metadata.localeId || 'N/A'}
- **Input File**: ${metadata.inputFile || 'N/A'}
- **Skip Existing**: ${metadata.skipExisting ?? 'N/A'}
- **Dry Run**: ${metadata.dryRun ?? 'N/A'}

## Summary
| Metric | Count |
|--------|-------|
| Total Processed | ${summary.totalProcessed} |
| Created | ${summary.created} |
| Updated | ${summary.updated} |
| Skipped | ${summary.skipped} |
| Failed | ${summary.failed} |
| Success Rate | ${summary.successRate.toFixed(2)}% |
`;

    // Add additional summary metrics if present
    if (typeof summary.associatedFoodLookupFailures === 'number') {
      content += `| Associated Food Lookup Failures | ${summary.associatedFoodLookupFailures} |\n`;
    }
    if (typeof summary.skippedAssociatedFoods === 'number') {
      content += `| Skipped Associated Foods | ${summary.skippedAssociatedFoods} |\n`;
    }
    if (typeof summary.deletedLocalFoods === 'number') {
      content += `| Deleted Local Foods | ${summary.deletedLocalFoods} |\n`;
    }

    content += `\n## Details\n`;

    // Successful operations
    const successful = details.filter(d => d.success);
    content += `\n### Successful Operations\n`;
    if (successful.length > 0) {
      content += `\n| Food Code | English Description | Operation |\n|-----------|-------------------|----------|\n`;
      for (const detail of successful) {
        content += `| ${this.escapeMarkdown(detail.foodCode)} | ${this.escapeMarkdown(detail.englishDescription)} | ${detail.operation} |\n`;
      }
    }
    else {
      content += '\nNo successful operations.\n';
    }

    // Failed operations
    const failed = details.filter(d => !d.success);
    if (failed.length > 0) {
      content += `\n### Failed Operations\n\n| Food Code | English Description | Error |\n|-----------|-------------------|-------|\n`;
      for (const detail of failed) {
        content += `| ${this.escapeMarkdown(detail.foodCode)} | ${this.escapeMarkdown(detail.englishDescription)} | ${this.escapeMarkdown(detail.error || 'Unknown error')} |\n`;
      }
    }

    // Deleted local foods
    if (report.deletedLocalFoods && report.deletedLocalFoods.length > 0) {
      content += `\n### Deleted Local Foods\n\n| Code | Name |\n|------|------|\n`;
      for (const food of report.deletedLocalFoods) {
        content += `| ${this.escapeMarkdown(food.code)} | ${this.escapeMarkdown(food.name)} |\n`;
      }
    }

    // Associated food issues
    const associatedFoodIssues = report.associatedFoodIssues || [];
    if (associatedFoodIssues.length > 0) {
      const lookupFailures = associatedFoodIssues.filter(i => i.isLookupFailure);
      const skippedCodes = associatedFoodIssues.filter(i => !i.isLookupFailure);

      content += `\n## Associated Food Issues\n\n`;

      if (lookupFailures.length > 0) {
        content += `### Lookup Failures (API Errors)\n\nThese associated foods were skipped because the API lookup failed after retries. They may need to be manually verified.\n\n| Food Code | Associated Code | Reason |\n|-----------|----------------|--------|\n`;
        for (const issue of lookupFailures) {
          content += `| ${this.escapeMarkdown(issue.foodCode || '')} | ${this.escapeMarkdown(issue.associatedCode)} | ${this.escapeMarkdown(issue.reason)} |\n`;
        }
        content += '\n';
      }

      if (skippedCodes.length > 0) {
        content += `### Skipped Associated Foods (Not Found)\n\nThese associated foods were skipped because the referenced code does not exist in the database.\n\n| Food Code | Associated Code | Reason |\n|-----------|----------------|--------|\n`;
        for (const issue of skippedCodes) {
          content += `| ${this.escapeMarkdown(issue.foodCode || '')} | ${this.escapeMarkdown(issue.associatedCode)} | ${this.escapeMarkdown(issue.reason)} |\n`;
        }
      }
    }

    // Rollback info
    if (report.rollbackInfo) {
      content += `\n## Rollback Information\n\n`;
      content += `- **Created Global Foods**: ${report.rollbackInfo.createdGlobalFoods.length}\n`;
      content += `- **Created Local Foods**: ${report.rollbackInfo.createdLocalFoods.length}\n`;
      content += `- **Original Enabled Foods**: ${report.rollbackInfo.originalEnabledFoods.length}\n`;
    }

    writeFileSync(outputPath, content, 'utf-8');
  }

  /**
   * Escape special Markdown characters
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\|/g, '\\|')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  }

  /**
   * Create initial report metadata
   */
  createMetadata(options: Partial<ReportMetadata> = {}): ReportMetadata {
    return {
      startTime: new Date(),
      ...options,
    };
  }

  /**
   * Create initial report summary
   */
  createSummary(options: Partial<ReportSummary> = {}): ReportSummary {
    return {
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      successRate: 0,
      ...options,
    };
  }

  /**
   * Finalize report with end time and success rate calculation
   */
  finalizeReport<R extends Report>(report: R): R {
    const endTime = new Date();
    report.metadata.endTime = endTime;
    report.metadata.duration = endTime.getTime() - report.metadata.startTime.getTime();
    report.summary.successRate = report.summary.totalProcessed > 0
      ? ((report.summary.totalProcessed - report.summary.failed) / report.summary.totalProcessed) * 100
      : 0;
    return report;
  }
}

// Export singleton for convenience
export const reportGeneratorService = new ReportGeneratorService();
