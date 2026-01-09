import { promises as fs } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

interface ExportTranslationsOptions {
  sourcePath: string;
  baseLang?: string;
  targetLang: string;
  outputPath: string;
}

type FlatEntry = [string, string];

function flattenObject(source: Record<string, any>, prefix = ''): FlatEntry[] {
  const entries: FlatEntry[] = [];

  for (const [key, value] of Object.entries(source)) {
    const composedKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenObject(value as Record<string, any>, composedKey));
      continue;
    }

    if (Array.isArray(value)) {
      entries.push([composedKey, JSON.stringify(value)]);
      continue;
    }

    entries.push([composedKey, normalizeValue(value)]);
  }

  return entries;
}

function normalizeValue(value: unknown): string {
  if (value === undefined || value === null)
    return '';

  if (typeof value === 'string')
    return value;

  if (typeof value === 'number' || typeof value === 'boolean')
    return value.toString();

  return JSON.stringify(value);
}

function toCsv(rows: string[][]): string {
  return rows
    .map(row => row.map((value) => {
      if (value === undefined || value === null)
        return '';

      const string = String(value);
      return /[",\n]/.test(string)
        ? `"${string.replace(/"/g, '""')}"`
        : string;
    }).join(','))
    .join('\n');
}

async function readJsonIfExists(path: string): Promise<Record<string, any>> {
  try {
    const content = await fs.readFile(path, 'utf8');
    return JSON.parse(content);
  }
  catch (error: any) {
    if (error?.code === 'ENOENT')
      return {};

    throw error;
  }
}

async function ensureDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

export default async function exportTranslationsCommand(options: ExportTranslationsOptions): Promise<void> {
  const sourceRoot = resolve(options.sourcePath);
  const baseLang = options.baseLang ?? 'en';
  const targetLang = options.targetLang;
  const outputRoot = resolve(options.outputPath);

  const modules = await fs.readdir(sourceRoot, { withFileTypes: true });
  let totalRows = 0;

  for (const entry of modules) {
    if (!entry.isDirectory())
      continue;

    const moduleName = entry.name;
    const moduleRoot = join(sourceRoot, moduleName);
    const baseLangDir = join(moduleRoot, baseLang);
    const targetLangDir = join(moduleRoot, targetLang);

    try {
      await fs.access(baseLangDir);
    }
    catch {
      // Module without base language directory - skip with warning
      console.warn(`⚠️  Skipping module \"${moduleName}\": base language directory not found (${relative(process.cwd(), baseLangDir)})`);
      continue;
    }

    const files = (await fs.readdir(baseLangDir)).filter(file => file.endsWith('.json'));

    if (files.length === 0) {
      console.warn(`⚠️  Skipping module \"${moduleName}\": no JSON files found in ${relative(process.cwd(), baseLangDir)}`);
      continue;
    }

    const rows: string[][] = [[
      'file',
      'key',
      baseLang,
      targetLang,
    ]];

    for (const file of files.sort()) {
      const baseJsonPath = join(baseLangDir, file);
      const targetJsonPath = join(targetLangDir, file);

      const baseJson = await readJsonIfExists(baseJsonPath);
      const targetJson = await readJsonIfExists(targetJsonPath);

      const baseEntries = new Map(flattenObject(baseJson));
      const targetEntries = new Map(flattenObject(targetJson));

      const keys = new Set<string>([
        ...baseEntries.keys(),
        ...targetEntries.keys(),
      ]);

      [...keys].sort().forEach((key) => {
        rows.push([
          file,
          key,
          baseEntries.get(key) ?? '',
          targetEntries.get(key) ?? '',
        ]);
      });
    }

    if (rows.length === 1) {
      console.warn(`⚠️  Module \"${moduleName}\" produced no rows, skipping export`);
      continue;
    }

    const moduleOutputDir = join(outputRoot, moduleName);
    await ensureDirectory(moduleOutputDir);

    const outputFile = join(moduleOutputDir, `${moduleName}-${targetLang}.csv`);
    await fs.writeFile(outputFile, toCsv(rows), 'utf8');

    const moduleRowCount = rows.length - 1;
    totalRows += moduleRowCount;

    console.log(`✅ Exported ${moduleRowCount} rows from ${moduleName} to ${relative(process.cwd(), outputFile)}`);
  }

  console.log(`
🎉 Translation export finished. Total rows: ${totalRows}`);
}
