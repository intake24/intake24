import type { Report } from '../services/report-generator.service';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ReportGeneratorService } from '../services/report-generator.service';

describe('reportGeneratorService', () => {
  const service = new ReportGeneratorService();
  let tempDir: string;
  let testFiles: string[] = [];

  beforeEach(() => {
    tempDir = tmpdir();
    testFiles = [];
  });

  afterEach(() => {
    // Clean up test files
    for (const file of testFiles) {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    }
  });

  const createTestReport = (): Report => ({
    metadata: {
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T10:05:00Z'),
      duration: 300000,
      localeId: 'en_GB',
      inputFile: '/path/to/input.csv',
      skipExisting: true,
      dryRun: false,
    },
    summary: {
      totalProcessed: 100,
      created: 50,
      updated: 30,
      skipped: 15,
      failed: 5,
      successRate: 95,
    },
    details: [
      {
        timestamp: new Date('2024-01-15T10:01:00Z'),
        foodCode: 'FOOD001',
        englishDescription: 'Test Food 1',
        localDescription: 'Test Food 1 Local',
        operation: 'created',
        success: true,
      },
      {
        timestamp: new Date('2024-01-15T10:02:00Z'),
        foodCode: 'FOOD002',
        englishDescription: 'Test Food 2',
        localDescription: 'Test Food 2 Local',
        operation: 'failed',
        success: false,
        error: 'Invalid nutrient code',
      },
    ],
    associatedFoodIssues: [
      {
        foodCode: 'FOOD003',
        associatedCode: 'SUGAR',
        reason: 'Code not found',
        isLookupFailure: false,
      },
    ],
  });

  describe('createMetadata', () => {
    it('should create metadata with current time', () => {
      const metadata = service.createMetadata();
      expect(metadata.startTime).toBeInstanceOf(Date);
    });

    it('should merge provided options', () => {
      const metadata = service.createMetadata({
        localeId: 'jp_JP_2024',
        inputFile: 'test.csv',
      });
      expect(metadata.localeId).toBe('jp_JP_2024');
      expect(metadata.inputFile).toBe('test.csv');
    });
  });

  describe('createSummary', () => {
    it('should create summary with zeros', () => {
      const summary = service.createSummary();
      expect(summary.totalProcessed).toBe(0);
      expect(summary.created).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.successRate).toBe(0);
    });

    it('should merge provided options', () => {
      const summary = service.createSummary({ totalProcessed: 10 });
      expect(summary.totalProcessed).toBe(10);
    });
  });

  describe('finalizeReport', () => {
    it('should set end time and duration', () => {
      const report: Report = {
        metadata: { startTime: new Date(Date.now() - 1000) },
        summary: { totalProcessed: 10, created: 8, updated: 0, skipped: 0, failed: 2, successRate: 0 },
        details: [],
      };

      service.finalizeReport(report);

      expect(report.metadata.endTime).toBeInstanceOf(Date);
      expect(report.metadata.duration).toBeGreaterThan(0);
    });

    it('should calculate success rate', () => {
      const report: Report = {
        metadata: { startTime: new Date() },
        summary: { totalProcessed: 10, created: 5, updated: 3, skipped: 0, failed: 2, successRate: 0 },
        details: [],
      };

      service.finalizeReport(report);

      expect(report.summary.successRate).toBe(80);
    });

    it('should handle zero processed', () => {
      const report: Report = {
        metadata: { startTime: new Date() },
        summary: { totalProcessed: 0, created: 0, updated: 0, skipped: 0, failed: 0, successRate: 0 },
        details: [],
      };

      service.finalizeReport(report);

      expect(report.summary.successRate).toBe(0);
    });
  });

  describe('generate', () => {
    it('should generate JSON report', async () => {
      const report = createTestReport();
      const outputPath = join(tempDir, `test-report-${Date.now()}.json`);
      testFiles.push(outputPath);

      await service.generate(report, 'json', outputPath);

      expect(existsSync(outputPath)).toBe(true);
      const content = JSON.parse(readFileSync(outputPath, 'utf-8'));
      expect(content.summary.totalProcessed).toBe(100);
      expect(content.details).toHaveLength(2);
    });

    it('should generate CSV report', async () => {
      const report = createTestReport();
      const outputPath = join(tempDir, `test-report-${Date.now()}.csv`);
      testFiles.push(outputPath);

      await service.generate(report, 'csv', outputPath);

      expect(existsSync(outputPath)).toBe(true);
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('Food Code');
      expect(content).toContain('FOOD001');
      expect(content).toContain('FOOD002');
      expect(content).toContain('Total Processed');
    });

    it('should generate Markdown report', async () => {
      const report = createTestReport();
      const outputPath = join(tempDir, `test-report-${Date.now()}.md`);
      testFiles.push(outputPath);

      await service.generate(report, 'markdown', outputPath);

      expect(existsSync(outputPath)).toBe(true);
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('# Food Import Report');
      expect(content).toContain('## Metadata');
      expect(content).toContain('## Summary');
      expect(content).toContain('## Details');
      expect(content).toContain('FOOD001');
      expect(content).toContain('Invalid nutrient code');
    });

    it('should include associated food issues in Markdown', async () => {
      const report = createTestReport();
      const outputPath = join(tempDir, `test-report-${Date.now()}.md`);
      testFiles.push(outputPath);

      await service.generate(report, 'markdown', outputPath);

      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('## Associated Food Issues');
      expect(content).toContain('SUGAR');
      expect(content).toContain('Code not found');
    });

    it('should throw error for unsupported format', async () => {
      const report = createTestReport();
      const outputPath = join(tempDir, `test-report-${Date.now()}.txt`);

      await expect(service.generate(report, 'txt' as any, outputPath)).rejects.toThrow('Unsupported report format');
    });
  });

  describe('cSV escaping', () => {
    it('should escape quotes in CSV', async () => {
      const report: Report = {
        metadata: { startTime: new Date() },
        summary: { totalProcessed: 1, created: 1, updated: 0, skipped: 0, failed: 0, successRate: 100 },
        details: [
          {
            timestamp: new Date(),
            foodCode: 'TEST',
            englishDescription: 'Food with "quotes"',
            localDescription: 'Local',
            operation: 'created',
            success: true,
          },
        ],
      };

      const outputPath = join(tempDir, `test-escape-${Date.now()}.csv`);
      testFiles.push(outputPath);

      await service.generate(report, 'csv', outputPath);

      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('""quotes""');
    });
  });

  describe('markdown escaping', () => {
    it('should escape pipe characters in Markdown', async () => {
      const report: Report = {
        metadata: { startTime: new Date() },
        summary: { totalProcessed: 1, created: 1, updated: 0, skipped: 0, failed: 0, successRate: 100 },
        details: [
          {
            timestamp: new Date(),
            foodCode: 'TEST|CODE',
            englishDescription: 'Food | with pipes',
            localDescription: 'Local',
            operation: 'created',
            success: true,
          },
        ],
      };

      const outputPath = join(tempDir, `test-escape-${Date.now()}.md`);
      testFiles.push(outputPath);

      await service.generate(report, 'markdown', outputPath);

      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('TEST\\|CODE');
      expect(content).toContain('Food \\| with pipes');
    });
  });
});
