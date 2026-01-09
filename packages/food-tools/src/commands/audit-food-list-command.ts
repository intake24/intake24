import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse as parseCsv } from 'csv-parse/sync';

const DEFAULT_SKIP_HEADER_ROWS = 1;

type Severity = 'critical' | 'warning' | 'info';

type FieldKey =
  | 'foodCode'
  | 'action'
  | 'englishDescription'
  | 'localDescription'
  | 'nutrientTable'
  | 'nutrientRecordId'
  | 'portionSize'
  | 'categories'
  | 'associatedFood';

const FIELD_ALIASES: Record<string, string[]> = {
  foodCode: ['intake24_code', 'code'],
  action: ['action'],
  englishDescription: ['english_description', 'description'],
  localDescription: ['local_description', 'local_name'],
  nutrientTable: ['food_composition_table', 'source_database'],
  nutrientRecordId: ['food_composition_record_id', 'food_composition_id', 'fct_record_id'],
  portionSize: ['portion_size_estimation_methods', 'portion_size_methods'],
  categories: ['categories'],
  associatedFood: ['associated_food_category', 'associated_food', 'associated_food__category'],
  novaClass: ['nova_class', 'novaclass'],
  qualityOfMatch: ['quality_of_match'],
  frequencyOfConsumption: ['frequency_of_consumption'],
  readyMealOption: ['ready_meal_option'],
  sameAsBeforeOption: ['same_as_before_option'],
  reasonableAmount: ['reasonable_amount'],
  useInRecipes: ['use_in_recipes'],
  brandNames: ['brand_names'],
  brandSearchTerms: ['brand_names_as_search_terms'],
  synonyms: ['synonyms'],
  portionSizeNotes: ['portion_size_notes'],
  milkInHotDrink: ['milk_in_a_hot_drink'],
  revisedLocalDescription: ['revised_local_description'],
};

const REQUIRED_FIELDS: { label: string; aliases: string[] }[] = [
  { label: 'Intake24 code', aliases: FIELD_ALIASES.foodCode },
  { label: 'Action', aliases: FIELD_ALIASES.action },
  { label: 'English description', aliases: FIELD_ALIASES.englishDescription },
  { label: 'Local description', aliases: FIELD_ALIASES.localDescription },
  { label: 'Food composition table', aliases: FIELD_ALIASES.nutrientTable },
  { label: 'Food composition record ID', aliases: FIELD_ALIASES.nutrientRecordId },
  { label: 'Portion size methods', aliases: FIELD_ALIASES.portionSize },
  { label: 'Categories', aliases: FIELD_ALIASES.categories },
];

const KEY_COLUMN_STATS: { key: FieldKey; label: string; isArray?: boolean }[] = [
  { key: 'englishDescription', label: 'English description' },
  { key: 'localDescription', label: 'Local description' },
  { key: 'nutrientTable', label: 'Nutrient table' },
  { key: 'nutrientRecordId', label: 'Nutrient record ID' },
  { key: 'portionSize', label: 'Portion size methods' },
  { key: 'categories', label: 'Categories', isArray: true },
  { key: 'associatedFood', label: 'Associated food/category' },
];

const DIFF_FIELDS: { key: keyof CsvRow; label: string; isArray?: boolean }[] = [
  { key: 'action', label: 'Action' },
  { key: 'englishDescription', label: 'English description' },
  { key: 'localDescription', label: 'Local description' },
  { key: 'nutrientTable', label: 'Nutrient table' },
  { key: 'nutrientRecordId', label: 'Nutrient record ID' },
  { key: 'portionSize', label: 'Portion size methods' },
  { key: 'categories', label: 'Categories', isArray: true },
  { key: 'associatedFood', label: 'Associated food/category' },
];

const ISSUE_HINTS: Record<string, string> = {
  'Missing intake24 code': 'Add the Intake24 master code to the `Intake24 code` column.',
  'Invalid action value': 'Use one of the supported action codes (1–4) to describe the change type.',
  'Missing English description': 'Supply the English description that appears in the admin tools.',
  'Missing local description': 'Provide the locale-specific label shown to participants.',
  'Missing nutrient table mapping': 'Fill both the nutrient table and record ID so the row links to reference data.',
  'Incomplete nutrient table mapping': 'Provide both nutrient table and record ID or clear them both.',
  'Missing portion size methods': 'Add at least one portion size method block to drive estimation.',
  'No categories provided': 'Assign at least one food category for search and reporting.',
  'Missing associated food/category data': 'Link an associated food or category to support prompts and recipes.',
  'Duplicate intake24 code': 'Ensure each row uses a unique Intake24 code.',
};

const SEVERITY_ORDER: Severity[] = ['critical', 'warning', 'info'];

export interface AuditFoodListOptions {
  inputPath: string;
  reportPath?: string;
  reportFormat?: 'csv' | 'json' | 'markdown';
  includeValid?: boolean;
  skipHeaderRows?: number;
  baselinePath?: string;
}

interface AuditFoodListResolvedOptions {
  inputPath: string;
  reportPath?: string;
  reportFormat: 'csv' | 'json' | 'markdown';
  includeValid: boolean;
  skipHeaderRows: number;
  baselinePath?: string;
}

interface CsvRow {
  rowNumber: number;
  foodCode: string;
  action: string;
  englishDescription: string;
  localDescription: string;
  nutrientTable: string;
  nutrientRecordId: string;
  portionSize: string;
  categories: string[];
  associatedFood: string;
  novaClass: string;
  raw: Record<string, string>;
}

interface AuditIssue {
  rowNumber: number;
  foodCode: string;
  issue: string;
  severity: Severity;
  field?: string;
  details?: string;
  hint?: string;
}

interface ColumnStat {
  key: FieldKey;
  label: string;
  missing: number;
  total: number;
  missingPercent: number;
  unique: number;
}

interface TopIssue {
  issue: string;
  severity: Severity;
  count: number;
  field?: string;
}

interface FieldDiff {
  field: string;
  previous?: string;
  current?: string;
}

interface ChangeDetail {
  foodCode: string;
  rowNumber?: number;
  diffs: FieldDiff[];
}

interface ChangeSummary {
  baselineFile: string;
  newCodes: string[];
  removedCodes: string[];
  changed: ChangeDetail[];
}

interface FoodCodeGroup {
  foodCode: string;
  rowNumber: number;
  action: string;
  englishDescription: string;
  localDescription: string;
  keyValues: Record<string, string>;
  issues: AuditIssue[];
  diffs: FieldDiff[];
}

interface HeaderInfo {
  original: string[];
  normalized: string[];
  hadBom: boolean;
  categoryKeys: string[];
}

interface HeaderAnalysis {
  missingRequired: string[];
  unexpected: string[];
  hadBom: boolean;
}

interface AuditReport {
  metadata: {
    generatedAt: string;
    inputFile: string;
    baselineFile?: string;
    totalRows: number;
  };
  summary: {
    issues: number;
    severity: Record<Severity, number>;
    perfectRows: number;
    duplicateCodes: string[];
    header: HeaderAnalysis;
    changes?: {
      newCount: number;
      removedCount: number;
      changedCount: number;
    };
  };
  issues: AuditIssue[];
  validRows: string[];
  topIssues: TopIssue[];
  columnStats: ColumnStat[];
  groups: FoodCodeGroup[];
  changeSummary?: ChangeSummary;
}

class CsvInspector {
  private headerKeys: string[] = [];
  private originalHeaders: string[] = [];
  private categoryKeys: string[] = [];
  private hadBom = false;

  parse(filePath: string, skipHeaderRows: number): CsvRow[] {
    const content = readFileSync(filePath, 'utf8');
    if (!content.trim())
      throw new Error('CSV file is empty.');

    const headerLineIdx = this.findHeaderLineIndex(content);
    const effectiveHeaderIdx = headerLineIdx >= 0 ? headerLineIdx : Math.max(skipHeaderRows - 1, 0);
    const fromLine = effectiveHeaderIdx + 1;
    const dataStart = effectiveHeaderIdx + 2;

    const records = parseCsv(content, {
      columns: (header: string[]) => {
        this.originalHeaders = header;
        this.headerKeys = this.normalizeHeaders(header);
        this.categoryKeys = this.detectCategoryColumns(header, this.headerKeys);
        return this.headerKeys;
      },
      from_line: fromLine,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    }) as Record<string, unknown>[];

    const rows: CsvRow[] = [];
    records.forEach((record, idx) => {
      const rowNumber = dataStart + idx;
      const normalizedRecord: Record<string, string> = {};

      this.headerKeys.forEach((key) => {
        const value = record[key];
        if (value === undefined || value === null) {
          normalizedRecord[key] = '';
          return;
        }

        const text = typeof value === 'string' ? value : String(value);
        normalizedRecord[key] = text.trim();
      });

      rows.push({
        rowNumber,
        foodCode: this.getValue(record, FIELD_ALIASES.foodCode),
        action: this.getValue(record, FIELD_ALIASES.action),
        englishDescription: this.getValue(record, FIELD_ALIASES.englishDescription),
        localDescription: this.getValue(record, FIELD_ALIASES.localDescription),
        nutrientTable: this.getValue(record, FIELD_ALIASES.nutrientTable),
        nutrientRecordId: this.getValue(record, FIELD_ALIASES.nutrientRecordId),
        portionSize: this.getValue(record, FIELD_ALIASES.portionSize),
        categories: this.collectCategories(record),
        associatedFood: this.getValue(record, FIELD_ALIASES.associatedFood),
        novaClass: this.getValue(record, FIELD_ALIASES.novaClass),
        raw: normalizedRecord,
      });
    });

    return rows;
  }

  headerInfo(): HeaderInfo {
    return {
      original: this.originalHeaders,
      normalized: this.headerKeys,
      hadBom: this.hadBom,
      categoryKeys: this.categoryKeys,
    };
  }

  private findHeaderLineIndex(content: string): number {
    const lines = content.split(/\r?\n/);
    return lines.findIndex(line => /intake24\s*code/i.test(line));
  }

  private normalizeHeaders(headers: string[]): string[] {
    const seen = new Map<string, number>();
    const normalized: string[] = [];

    headers.forEach((header, index) => {
      let value = header ?? '';

      if (value.startsWith('\uFEFF')) {
        this.hadBom = true;
        value = value.slice(1);
      }

      const trimmed = value.trim();
      let candidate = trimmed
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      if (!candidate)
        candidate = `column_${index}`;

      const count = seen.get(candidate) ?? 0;
      if (count > 0)
        candidate = `${candidate}_${count + 1}`;
      seen.set(candidate, count + 1);

      normalized.push(candidate);
    });

    return normalized;
  }

  private detectCategoryColumns(original: string[], normalized: string[]): string[] {
    const keys: string[] = [];
    let collecting = false;

    original.forEach((value, idx) => {
      const trimmed = value?.trim();
      const key = normalized[idx];

      if (trimmed?.toLowerCase() === 'categories') {
        collecting = true;
        keys.push(key);
        return;
      }

      if (collecting && (!trimmed || trimmed.length === 0)) {
        keys.push(key);
        return;
      }

      if (collecting)
        collecting = false;
    });

    return keys;
  }

  private getValue(record: Record<string, unknown>, aliases: string[]): string {
    for (const alias of aliases) {
      const value = record[alias];
      if (value === undefined || value === null)
        continue;

      const stringValue = typeof value === 'string' ? value : String(value);
      const trimmed = stringValue.trim();
      if (trimmed.length)
        return trimmed;
    }

    return '';
  }

  private collectCategories(record: Record<string, unknown>): string[] {
    const values: string[] = [];
    const keys = this.categoryKeys.length ? this.categoryKeys : ['categories'];

    keys.forEach((key) => {
      const value = record[key];
      if (value === undefined || value === null)
        return;

      const text = typeof value === 'string' ? value : String(value);
      const trimmed = text.trim();
      if (!trimmed)
        return;

      trimmed
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .forEach(token => values.push(token));
    });

    return [...new Set(values)];
  }
}

class FoodListAuditor {
  constructor(private readonly options: AuditFoodListResolvedOptions) {}

  run(): AuditReport {
    const inspector = new CsvInspector();
    const rows = inspector.parse(this.options.inputPath, this.options.skipHeaderRows);
    const headerInfo = inspector.headerInfo();

    const baselineMap = this.options.baselinePath
      ? this.loadBaseline(this.options.baselinePath, this.options.skipHeaderRows)
      : undefined;

    const rowIssues = new Map<number, AuditIssue[]>();

    rows.forEach((row) => {
      const issues = this.evaluateRow(row);
      if (issues.length)
        rowIssues.set(row.rowNumber, issues);
    });

    const duplicateCodes = this.detectDuplicateCodes(rows);
    duplicateCodes.forEach(({ row, count }) => {
      const issue = this.issue(row, 'Duplicate intake24 code', 'critical', {
        field: 'foodCode',
        details: `Appears ${count} times`,
      });
      this.pushIssue(rowIssues, row.rowNumber, issue);
    });

    const flatIssues = Array.from(rowIssues.values()).flat();

    const validRows = this.options.includeValid
      ? rows
          .filter(row => (rowIssues.get(row.rowNumber)?.length ?? 0) === 0)
          .map(row => row.foodCode || `row-${row.rowNumber}`)
      : [];

    const severityCounts: Record<Severity, number> = {
      critical: flatIssues.filter(issue => issue.severity === 'critical').length,
      warning: flatIssues.filter(issue => issue.severity === 'warning').length,
      info: flatIssues.filter(issue => issue.severity === 'info').length,
    };

    const perfectRows = rows.length - new Set(flatIssues.map(issue => issue.rowNumber)).size;

    const headerAnalysis = this.analyseHeaders(headerInfo);

    const columnStats = this.computeColumnStats(rows);
    const topIssues = this.computeTopIssues(flatIssues);

    const groups = this.buildGroups(rows, rowIssues, baselineMap);

    const changeSummary = baselineMap ? this.computeChangeSummary(rows, baselineMap) : undefined;

    const summary = {
      issues: flatIssues.length,
      severity: severityCounts,
      perfectRows,
      duplicateCodes: [...new Set(duplicateCodes.map(entry => entry.row.foodCode).filter(Boolean))].sort(),
      header: headerAnalysis,
      changes: changeSummary
        ? {
            newCount: changeSummary.newCodes.length,
            removedCount: changeSummary.removedCodes.length,
            changedCount: changeSummary.changed.length,
          }
        : undefined,
    };

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        inputFile: this.options.inputPath,
        baselineFile: this.options.baselinePath,
        totalRows: rows.length,
      },
      summary,
      issues: flatIssues,
      validRows,
      topIssues,
      columnStats,
      groups,
      changeSummary,
    };
  }

  private loadBaseline(filePath: string, skipHeaderRows: number): Map<string, CsvRow> {
    const inspector = new CsvInspector();
    const rows = inspector.parse(filePath, skipHeaderRows);

    const map = new Map<string, CsvRow>();
    rows.forEach((row) => {
      if (!row.foodCode)
        return;
      if (!map.has(row.foodCode))
        map.set(row.foodCode, row);
    });
    return map;
  }

  private evaluateRow(row: CsvRow): AuditIssue[] {
    const issues: AuditIssue[] = [];

    if (!row.foodCode) {
      issues.push(this.issue(row, 'Missing intake24 code', 'critical', { field: 'foodCode' }));
    }

    if (!['1', '2', '3', '4'].includes(row.action)) {
      const details = row.action ? `Value: ${row.action}` : 'Value not provided';
      issues.push(
        this.issue(row, 'Invalid action value', 'critical', {
          field: 'action',
          details,
          hint: 'Accepted values are 1 (exclude from locale), 2–3 (include existing locale foods), or 4 (include and create a new global food when needed).',
        }),
      );
    }

    if (!row.englishDescription)
      issues.push(this.issue(row, 'Missing English description', 'critical', { field: 'englishDescription' }));

    if (!row.localDescription)
      issues.push(this.issue(row, 'Missing local description', 'warning', { field: 'localDescription' }));

    const hasNutrientFields = row.nutrientTable || row.nutrientRecordId;
    if (!hasNutrientFields) {
      issues.push(this.issue(row, 'Missing nutrient table mapping', 'warning', { field: 'nutrientTable' }));
    }
    else if (!row.nutrientTable || !row.nutrientRecordId) {
      const details = `${row.nutrientTable || 'table missing'} / ${row.nutrientRecordId || 'record missing'}`;
      issues.push(
        this.issue(row, 'Incomplete nutrient table mapping', 'warning', {
          field: 'nutrientTable',
          details,
        }),
      );
    }

    if (!row.portionSize)
      issues.push(this.issue(row, 'Missing portion size methods', 'warning', { field: 'portionSize' }));

    if (!row.categories.length)
      issues.push(this.issue(row, 'No categories provided', 'warning', { field: 'categories' }));

    if (!row.associatedFood)
      issues.push(this.issue(row, 'Missing associated food/category data', 'info', { field: 'associatedFood' }));

    return issues;
  }

  private issue(
    row: CsvRow,
    message: string,
    severity: Severity,
    options: { field?: string; details?: string; hint?: string } = {},
  ): AuditIssue {
    const hint = options.hint ?? ISSUE_HINTS[message];

    return {
      rowNumber: row.rowNumber,
      foodCode: row.foodCode || `row-${row.rowNumber}`,
      issue: message,
      severity,
      field: options.field,
      details: options.details,
      hint,
    };
  }

  private pushIssue(container: Map<number, AuditIssue[]>, rowNumber: number, issue: AuditIssue): void {
    const existing = container.get(rowNumber) ?? [];
    existing.push(issue);
    container.set(rowNumber, existing);
  }

  private detectDuplicateCodes(rows: CsvRow[]): { row: CsvRow; count: number }[] {
    const map = new Map<string, CsvRow[]>();

    rows.forEach((row) => {
      if (!row.foodCode)
        return;
      const list = map.get(row.foodCode) ?? [];
      list.push(row);
      map.set(row.foodCode, list);
    });

    const duplicates: { row: CsvRow; count: number }[] = [];
    map.forEach((list) => {
      if (list.length > 1)
        list.forEach(row => duplicates.push({ row, count: list.length }));
    });

    return duplicates;
  }

  private analyseHeaders(info: HeaderInfo): HeaderAnalysis {
    const normalizedSet = new Set(info.normalized);

    const missingRequired = REQUIRED_FIELDS.filter(req => !req.aliases.some(alias => normalizedSet.has(alias)))
      .map(req => req.label);

    const knownHeaders = new Set<string>((Object.values(FIELD_ALIASES).flat()));

    const unexpected = info.normalized
      .map((key, idx) => ({ key, original: info.original[idx] ?? key }))
      .filter(({ key, original }) => {
        if (info.categoryKeys.includes(key))
          return false;
        if (!original || !original.trim())
          return false;
        if (knownHeaders.has(key))
          return false;
        if (/^categories_\d+$/.test(key))
          return false;
        return true;
      })
      .map(entry => entry.original.trim() || entry.key);

    return {
      missingRequired,
      unexpected,
      hadBom: info.hadBom,
    };
  }

  private computeColumnStats(rows: CsvRow[]): ColumnStat[] {
    return KEY_COLUMN_STATS.map(({ key, label, isArray }) => {
      const missing = rows.filter((row) => {
        const value = row[key];
        if (Array.isArray(value))
          return value.length === 0;
        return !value;
      }).length;

      const uniqueValues = new Set(
        rows
          .map((row) => {
            const value = row[key];
            if (Array.isArray(value))
              return value.join(' | ').trim();
            return value?.trim?.() ?? '';
          })
          .filter(Boolean),
      ).size;

      return {
        key,
        label,
        missing,
        total: rows.length,
        missingPercent: rows.length ? (missing / rows.length) * 100 : 0,
        unique: uniqueValues,
      };
    });
  }

  private computeTopIssues(issues: AuditIssue[]): TopIssue[] {
    const counter = new Map<string, { issue: string; severity: Severity; count: number; field?: string }>();

    issues.forEach((issue) => {
      const key = `${issue.severity}::${issue.issue}::${issue.field ?? ''}`;
      const current = counter.get(key) ?? { issue: issue.issue, severity: issue.severity, count: 0, field: issue.field };
      current.count += 1;
      counter.set(key, current);
    });

    return [...counter.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }

  private buildGroups(
    rows: CsvRow[],
    issuesMap: Map<number, AuditIssue[]>,
    baseline?: Map<string, CsvRow>,
  ): FoodCodeGroup[] {
    const groups: FoodCodeGroup[] = [];

    rows.forEach((row) => {
      const issues = issuesMap.get(row.rowNumber) ?? [];
      const baselineRow = row.foodCode && baseline ? baseline.get(row.foodCode) : undefined;
      const diffs = baselineRow ? this.computeDiff(row, baselineRow) : [];

      if (!issues.length && !diffs.length)
        return;

      groups.push({
        foodCode: row.foodCode || `row-${row.rowNumber}`,
        rowNumber: row.rowNumber,
        action: row.action,
        englishDescription: row.englishDescription,
        localDescription: row.localDescription,
        keyValues: this.buildKeyValues(row),
        issues,
        diffs,
      });
    });

    const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

    return groups.sort((a, b) => {
      const aSeverity = Math.min(
        ...a.issues.map(issue => severityRank[issue.severity]),
        a.issues.length ? Infinity : severityRank.info,
      );
      const bSeverity = Math.min(
        ...b.issues.map(issue => severityRank[issue.severity]),
        b.issues.length ? Infinity : severityRank.info,
      );

      if (a.issues.length && b.issues.length && aSeverity !== bSeverity)
        return aSeverity - bSeverity;
      if (a.issues.length && !b.issues.length)
        return -1;
      if (!a.issues.length && b.issues.length)
        return 1;

      return a.foodCode.localeCompare(b.foodCode);
    });
  }

  private buildKeyValues(row: CsvRow): Record<string, string> {
    const joinedCategories = row.categories.slice(0, 6).join(', ');
    const portionSnippet = row.portionSize.split('\n')[0] ?? '';

    return {
      English: row.englishDescription || '—',
      Local: row.localDescription || '—',
      Nutrient: row.nutrientTable && row.nutrientRecordId
        ? `${row.nutrientTable} / ${row.nutrientRecordId}`
        : row.nutrientTable || row.nutrientRecordId || '—',
      Portion: portionSnippet || '—',
      Categories: joinedCategories || '—',
      Associated: row.associatedFood || '—',
    };
  }

  private computeDiff(current: CsvRow, previous: CsvRow): FieldDiff[] {
    return DIFF_FIELDS.reduce<FieldDiff[]>((diffs, { key, label, isArray }) => {
      const currentValue = isArray
        ? (current[key] as string[]).join(', ')
        : (current[key] as string);
      const previousValue = isArray
        ? (previous[key] as string[]).join(', ')
        : (previous[key] as string);

      if ((currentValue || '') !== (previousValue || ''))
        diffs.push({ field: label, previous: previousValue || undefined, current: currentValue || undefined });

      return diffs;
    }, []);
  }

  private computeChangeSummary(rows: CsvRow[], baseline: Map<string, CsvRow>): ChangeSummary {
    const currentMap = new Map<string, CsvRow>();
    rows.forEach((row) => {
      if (row.foodCode && !currentMap.has(row.foodCode))
        currentMap.set(row.foodCode, row);
    });

    const currentCodes = new Set(currentMap.keys());
    const baselineCodes = new Set(baseline.keys());

    const newCodes = [...currentCodes].filter(code => !baselineCodes.has(code)).sort();
    const removedCodes = [...baselineCodes].filter(code => !currentCodes.has(code)).sort();

    const changed: ChangeDetail[] = [];

    [...currentCodes]
      .filter(code => baselineCodes.has(code))
      .forEach((code) => {
        const currentRow = currentMap.get(code)!;
        const previousRow = baseline.get(code)!;
        const diffs = this.computeDiff(currentRow, previousRow);
        if (diffs.length)
          changed.push({ foodCode: code, rowNumber: currentRow.rowNumber, diffs });
      });

    return {
      baselineFile: this.options.baselinePath!,
      newCodes,
      removedCodes,
      changed,
    };
  }
}

function formatReport(report: AuditReport, format: 'csv' | 'json' | 'markdown'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(report, null, 2);
    case 'markdown':
      return renderMarkdown(report);
    case 'csv':
    default:
      return renderCsv(report);
  }
}

function renderCsv(report: AuditReport): string {
  const lines = ['Row,Food Code,Field,Issue,Severity,Details,Hint'];
  report.issues.forEach((issue) => {
    const detail = issue.details ? issue.details.replace(/"/g, '""') : '';
    const hint = issue.hint ? issue.hint.replace(/"/g, '""') : '';
    lines.push(
      `${issue.rowNumber},${issue.foodCode},${issue.field ?? ''},"${issue.issue}",${issue.severity},"${detail}","${hint}"`,
    );
  });
  return lines.join('\n');
}

function renderMarkdown(report: AuditReport): string {
  const lines: string[] = [];

  lines.push('# Food List Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${report.metadata.generatedAt}`);
  lines.push(`**Input file:** ${report.metadata.inputFile}`);
  if (report.metadata.baselineFile)
    lines.push(`**Baseline file:** ${report.metadata.baselineFile}`);
  lines.push(`**Total rows:** ${report.metadata.totalRows}`);
  lines.push('');

  lines.push('## Key Findings');
  lines.push(
    `- Issues: ${report.summary.issues} (critical ${report.summary.severity.critical}, warning ${report.summary.severity.warning}, info ${report.summary.severity.info})`,
  );
  lines.push(`- Perfect rows: ${report.summary.perfectRows}`);
  lines.push(
    `- Duplicate codes: ${report.summary.duplicateCodes.length ? report.summary.duplicateCodes.join(', ') : 'None'}`,
  );
  if (report.summary.header.missingRequired.length)
    lines.push(`- Missing required columns: ${report.summary.header.missingRequired.join(', ')}`);
  if (report.summary.header.unexpected.length)
    lines.push(`- Unexpected columns: ${report.summary.header.unexpected.join(', ')}`);
  lines.push(`- Byte Order Mark detected: ${report.summary.header.hadBom ? 'Yes' : 'No'}`);
  if (report.summary.changes)
    lines.push(
      `- Baseline comparison: +${report.summary.changes.newCount} / -${report.summary.changes.removedCount} / Δ${report.summary.changes.changedCount}`,
    );
  lines.push('');

  if (report.topIssues.length) {
    lines.push('## Top Issues');
    lines.push('| Issue | Severity | Count |');
    lines.push('| --- | --- | --- |');
    report.topIssues.forEach((item) => {
      lines.push(`| ${item.issue} ${item.field ? `(${item.field})` : ''} | ${item.severity} | ${item.count} |`);
    });
    lines.push('');
  }

  if (report.columnStats.length) {
    lines.push('## Column Completeness');
    lines.push('| Column | Missing | Missing % | Unique values |');
    lines.push('| --- | ---: | ---: | ---: |');
    report.columnStats.forEach((stat) => {
      lines.push(
        `| ${stat.label} | ${stat.missing} | ${stat.missingPercent.toFixed(1)} | ${stat.unique} |`,
      );
    });
    lines.push('');
  }

  lines.push('## Issues by Severity');
  SEVERITY_ORDER.forEach((severity) => {
    const groups = report.groups
      .map(group => ({
        group,
        issues: group.issues.filter(issue => issue.severity === severity),
      }))
      .filter(entry => entry.issues.length);

    lines.push(`### ${severity.charAt(0).toUpperCase()}${severity.slice(1)}`);
    if (!groups.length) {
      lines.push(`No ${severity} issues detected.`);
      lines.push('');
      return;
    }

    groups.forEach(({ group, issues }) => {
      lines.push(`#### ${group.foodCode} (row ${group.rowNumber})`);
      const keyData = Object.entries(group.keyValues)
        .map(([key, value]) => `${key}="${truncate(value)}"`)
        .join(' · ');
      lines.push(`- Key data: ${keyData || '—'}`);
      issues.forEach((issue) => {
        const parts = [`${issue.issue}`];
        if (issue.field)
          parts.push(`field: ${issue.field}`);
        if (issue.details)
          parts.push(`details: ${issue.details}`);
        if (issue.hint)
          parts.push(`hint: ${issue.hint}`);
        lines.push(`- ${parts.join(' · ')}`);
      });
      if (group.diffs.length)
        lines.push(`- Changes vs baseline: ${group.diffs.map(diff => `${diff.field}: "${truncate(diff.previous ?? '—')}" → "${truncate(diff.current ?? '—')}"`).join('; ')}`);
      lines.push('');
    });
  });

  if (report.changeSummary) {
    const { newCodes, removedCodes, changed } = report.changeSummary;
    lines.push('## Changes vs Baseline');
    lines.push(`- New codes (${newCodes.length}): ${newCodes.length ? newCodes.join(', ') : '—'}`);
    lines.push(`- Removed codes (${removedCodes.length}): ${removedCodes.length ? removedCodes.join(', ') : '—'}`);
    if (changed.length) {
      lines.push('- Updated codes:');
      changed.forEach((entry) => {
        const changeText = entry.diffs
          .map(diff => `${diff.field}: "${truncate(diff.previous ?? '—')}" → "${truncate(diff.current ?? '—')}"`)
          .join('; ');
        lines.push(`  - ${entry.foodCode}: ${changeText}`);
      });
    }
    else {
      lines.push('- Updated codes: none');
    }
    lines.push('');
  }

  if (!report.issues.length)
    lines.push('✅ No row-level issues detected.');

  return lines.join('\n');
}

function truncate(value: string, length = 80): string {
  if (!value)
    return '—';
  if (value.length <= length)
    return value;
  return `${value.slice(0, length - 1)}…`;
}

export default async function auditFoodListCommand(options: AuditFoodListOptions): Promise<void> {
  if (!options.inputPath)
    throw new Error('Input path is required.');

  const resolvedPath = resolve(options.inputPath);

  const resolvedOptions: AuditFoodListResolvedOptions = {
    inputPath: resolvedPath,
    reportPath: options.reportPath ? resolve(options.reportPath) : undefined,
    reportFormat: options.reportFormat ?? 'json',
    includeValid: options.includeValid ?? false,
    skipHeaderRows: options.skipHeaderRows ?? DEFAULT_SKIP_HEADER_ROWS,
    baselinePath: options.baselinePath ? resolve(options.baselinePath) : undefined,
  };

  const auditor = new FoodListAuditor(resolvedOptions);
  const report = auditor.run();

  console.log('📋 Food List Audit');
  console.log(`├─ Input: ${resolvedPath}`);
  if (report.metadata.baselineFile)
    console.log(`├─ Baseline: ${report.metadata.baselineFile}`);
  console.log(`├─ Total rows: ${report.metadata.totalRows}`);
  console.log(`├─ Issues: ${report.summary.issues}`);
  console.log(`├─ Critical: ${report.summary.severity.critical}`);
  console.log(`├─ Warning: ${report.summary.severity.warning}`);
  console.log(`├─ Info: ${report.summary.severity.info}`);
  console.log(`├─ Perfect rows: ${report.summary.perfectRows}`);
  console.log(
    `├─ Duplicate codes: ${report.summary.duplicateCodes.length ? report.summary.duplicateCodes.join(', ') : 'none'}`,
  );
  if (report.summary.header.missingRequired.length)
    console.log(`├─ Missing columns: ${report.summary.header.missingRequired.join(', ')}`);
  if (report.summary.header.unexpected.length)
    console.log(`├─ Unexpected columns: ${report.summary.header.unexpected.join(', ')}`);
  console.log(`└─ BOM detected: ${report.summary.header.hadBom ? 'yes' : 'no'}`);

  const sample = report.topIssues.slice(0, 5);
  if (sample.length) {
    console.log('\nTop issues:');
    sample.forEach((item) => {
      console.log(`- [${item.severity}] ${item.issue}${item.field ? ` (${item.field})` : ''}: ${item.count}`);
    });
    if (report.topIssues.length > sample.length)
      console.log(`… and ${report.topIssues.length - sample.length} more.`);
  }

  if (report.summary.changes)
    console.log(
      `\nBaseline diff → +${report.summary.changes.newCount} / -${report.summary.changes.removedCount} / Δ${report.summary.changes.changedCount}`,
    );

  if (resolvedOptions.reportPath) {
    const output = formatReport(report, resolvedOptions.reportFormat ?? 'json');
    writeFileSync(resolvedOptions.reportPath, output);
    console.log(`\nReport saved to ${resolvedOptions.reportPath}`);
  }
}
