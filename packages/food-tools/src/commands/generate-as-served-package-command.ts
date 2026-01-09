import { constants as fsConstants } from 'node:fs';
import { copyFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import XLSX from 'xlsx';

import { logger as mainLogger } from '@intake24/common-backend/services/logger';

export interface GenerateAsServedPackageOptions {
  mode?: 'manifest' | 'folders';
  manifestPath?: string;
  outputPath: string;
  imageRoots?: string[];
  folderRoots?: string[];
  setIdPrefix?: string;
  trimSuffix?: string;
  cleanOutput?: boolean;
  dryRun?: boolean;
  overwriteExistingImages?: boolean;
}

interface ManifestRow {
  Filepath?: string | null;
  'Food name'?: string | null;
  'Image code'?: string | null;
  Weight?: number | string | null;
  No?: number | string | null;
  filepath?: string | null;
  foodName?: string | null;
  imageCode?: string | null;
  weight?: number | string | null;
  order?: number | string | null;
}

interface ResolvedImage {
  order: number;
  weight: number;
  sourcePath: string;
  fileName: string;
}

interface AsServedSetManifest {
  id: string;
  originalId: string;
  description: string;
  images: ResolvedImage[];
}

const logger = mainLogger.child({ service: 'generate-as-served-package' });

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  }
  catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT')
      return false;
    throw error;
  }
}

async function ensureDirectory(targetPath: string): Promise<void> {
  await mkdir(targetPath, { recursive: true });
}

function normaliseSetId(rawId: string): string {
  return rawId
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

function describeSet(rawId: string): string {
  return rawId.replace(/_/g, ' ').trim();
}

async function collectCandidateParents(
  imageRoots: string[],
  maxDepth = 4,
): Promise<string[]> {
  const candidates = new Set<string>();

  for (const rootPath of imageRoots) {
    const absoluteRoot = path.resolve(rootPath);

    const rootStat = await stat(absoluteRoot);
    if (!rootStat.isDirectory())
      throw new Error(`Image root is not a directory: ${absoluteRoot}`);

    candidates.add(absoluteRoot);

    const queue: Array<{ dir: string; depth: number }> = [
      { dir: absoluteRoot, depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth)
        continue;

      let entries;
      try {
        entries = await readdir(current.dir, { withFileTypes: true });
      }
      catch (error: unknown) {
        logger.warn(
          `Failed to read directory "${current.dir}": ${(error as Error).message}`,
        );
        continue;
      }

      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;

        const entryPath = path.join(current.dir, entry.name);
        const normalisedName = entry.name.toLowerCase().replace(/[\s_-]+/g, '');

        if (normalisedName === 'asserved') {
          candidates.add(entryPath);
          continue;
        }

        if (current.depth + 1 <= maxDepth)
          queue.push({ dir: entryPath, depth: current.depth + 1 });
      }
    }
  }

  return [...candidates];
}

async function resolveSetDirectories(
  uniqueIds: Iterable<string>,
  candidateParents: string[],
): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();

  for (const rawId of uniqueIds) {
    for (const parent of candidateParents) {
      const candidatePath = path.join(parent, rawId);
      if (await pathExists(candidatePath)) {
        mapping.set(rawId, candidatePath);
        break;
      }
    }

    if (!mapping.has(rawId))
      logger.warn(`Failed to resolve directory for set "${rawId}"`);
  }

  return mapping;
}

async function buildDirectoryIndex(dirPath: string): Promise<Map<string, string>> {
  const index = new Map<string, string>();

  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  }
  catch (error: unknown) {
    throw new Error(
      `Failed to read as served directory "${dirPath}": ${(error as Error).message}`,
    );
  }

  for (const entry of entries) {
    if (!entry.isFile())
      continue;

    const baseName = entry.name.replace(/\.[^.]+$/, '').toLowerCase();
    if (!index.has(baseName))
      index.set(baseName, entry.name);
  }

  return index;
}

function parseManifestRows(sheet: XLSX.Sheet): ManifestRow[] {
  const rows = XLSX.utils.sheet_to_json<ManifestRow>(sheet, {
    range: 0,
    defval: null,
  });

  return rows.map(row => ({
    filepath: row.Filepath ?? row.filepath ?? null,
    foodName: (row['Food name'] ?? row.foodName ?? null) as string | null,
    imageCode: (row['Image code'] ?? row.imageCode ?? null) as string | null,
    weight: row.Weight ?? row.weight ?? null,
    order: row.No ?? row.order ?? null,
  }));
}

function parseNumeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined)
    return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

async function buildAsServedManifest(
  manifestPath: string,
  candidateParents: string[],
): Promise<AsServedSetManifest[]> {
  const workbook = XLSX.readFile(manifestPath);
  if (workbook.SheetNames.length === 0)
    throw new Error(`Manifest has no sheets: ${manifestPath}`);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = parseManifestRows(sheet);

  const grouped = new Map<string, ManifestRow[]>();

  for (const row of rows) {
    const foodName = row.foodName?.trim();
    const imageCode = row.imageCode?.trim();

    if (!foodName || !imageCode) {
      logger.warn(`Skipping row with missing identifiers: ${JSON.stringify(row)}`);
      continue;
    }

    const weight = parseNumeric(row.weight);
    const order = parseNumeric(row.order);

    if (weight === null || order === null) {
      logger.warn(`Skipping row with invalid numeric data: ${JSON.stringify(row)}`);
      continue;
    }

    if (!grouped.has(foodName))
      grouped.set(foodName, []);
    grouped.get(foodName)!.push({
      ...row,
      weight,
      order,
    });
  }

  const setDirectories = await resolveSetDirectories(grouped.keys(), candidateParents);
  const directoryIndexCache = new Map<string, Map<string, string>>();
  const manifests: AsServedSetManifest[] = [];

  for (const [rawId, entries] of grouped.entries()) {
    const directoryPath = setDirectories.get(rawId);
    if (!directoryPath) {
      logger.warn(`No directory found for "${rawId}", skipping`);
      continue;
    }

    let directoryIndex = directoryIndexCache.get(directoryPath);
    if (!directoryIndex) {
      directoryIndex = await buildDirectoryIndex(directoryPath);
      directoryIndexCache.set(directoryPath, directoryIndex);
    }

    const images: ResolvedImage[] = [];

    for (const entry of entries) {
      const baseName = entry.imageCode!.toLowerCase();
      const fileName = directoryIndex.get(baseName);

      if (!fileName) {
        logger.warn(
          `Could not find image "${entry.imageCode}" for set "${rawId}" in ${directoryPath}`,
        );
        continue;
      }

      images.push({
        order: parseNumeric(entry.order)!,
        weight: parseNumeric(entry.weight)!,
        sourcePath: path.join(directoryPath, fileName),
        fileName,
      });
    }

    if (images.length === 0) {
      logger.warn(`Set "${rawId}" has no valid images, skipping`);
      continue;
    }

    const sortedImages = images.sort((a, b) => a.order - b.order);

    manifests.push({
      id: normaliseSetId(rawId),
      originalId: rawId,
      description: describeSet(rawId),
      images: sortedImages,
    });
  }

  return manifests;
}

function applyTrimSuffix(name: string, trimSuffix?: string): string {
  if (!trimSuffix)
    return name;

  if (name.toLowerCase().endsWith(trimSuffix.toLowerCase()))
    return name.slice(0, name.length - trimSuffix.length);

  return name;
}

interface FolderOptions {
  folderRoots: string[];
  setIdPrefix?: string;
  trimSuffix?: string;
}

async function buildAsServedManifestFromFolders(
  options: FolderOptions,
): Promise<AsServedSetManifest[]> {
  const manifests: AsServedSetManifest[] = [];
  const seenIds = new Set<string>();

  for (const root of options.folderRoots) {
    const absoluteRoot = path.resolve(root);
    const rootStat = await stat(absoluteRoot);

    if (!rootStat.isDirectory())
      throw new Error(`Folder root is not a directory: ${absoluteRoot}`);

    const entries = await readdir(absoluteRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory())
        continue;

      const trimmed = applyTrimSuffix(entry.name, options.trimSuffix);
      const setId = normaliseSetId(`${options.setIdPrefix ?? ''}${trimmed}`);

      if (seenIds.has(setId)) {
        logger.warn(`Duplicate set identifier "${setId}" derived from folder "${entry.name}", skipping`);
        continue;
      }

      const folderPath = path.join(absoluteRoot, entry.name);
      const files = await readdir(folderPath, { withFileTypes: true });

      const images: ResolvedImage[] = [];

      for (const file of files) {
        if (!file.isFile())
          continue;

        const match = file.name.match(/_(\d+)_([0-9.]+)g?\.(jpe?g|png)$/i);

        if (!match) {
          logger.warn(
            `Unable to parse portion metadata from file "${file.name}" in folder "${folderPath}", skipping`,
          );
          continue;
        }

        const order = Number.parseInt(match[1]!, 10);
        const weight = Number.parseFloat(match[2]!);

        if (!Number.isFinite(order) || !Number.isFinite(weight)) {
          logger.warn(
            `Invalid portion metadata in file "${file.name}" (order: ${match[1]}, weight: ${match[2]}), skipping`,
          );
          continue;
        }

        images.push({
          order,
          weight,
          sourcePath: path.join(folderPath, file.name),
          fileName: file.name,
        });
      }

      if (images.length === 0) {
        logger.warn(`Folder "${folderPath}" does not contain any valid images, skipping`);
        continue;
      }

      images.sort((a, b) => a.order - b.order);

      manifests.push({
        id: setId,
        originalId: entry.name,
        description: describeSet(trimmed),
        images,
      });

      seenIds.add(setId);
    }
  }

  return manifests;
}

async function copyImages(
  manifests: AsServedSetManifest[],
  outputImageDir: string,
  dryRun: boolean,
  overwriteExistingImages: boolean,
): Promise<number> {
  let copied = 0;

  for (const manifest of manifests) {
    const destinationDir = path.join(outputImageDir, manifest.id);

    if (!dryRun) {
      if (overwriteExistingImages)
        await rm(destinationDir, { recursive: true, force: true }).catch(() => {});

      await ensureDirectory(destinationDir);
    }

    for (const image of manifest.images) {
      const destinationPath = path.join(destinationDir, image.fileName);

      if (!dryRun) {
        try {
          await copyFile(image.sourcePath, destinationPath, fsConstants.COPYFILE_FICLONE);
        }
        catch (error: unknown) {
          const err = error as NodeJS.ErrnoException;

          if (
            err.code === 'ENOSYS'
            || err.code === 'ERR_FS_COPYFILE_IMPL'
            || err.code === 'EOPNOTSUPP'
          ) {
            await copyFile(image.sourcePath, destinationPath);
          }
          else {
            logger.warn(
              `Failed to copy "${image.sourcePath}" to "${destinationPath}": ${err.message}`,
            );
            continue;
          }
        }
      }

      copied += 1;
    }
  }

  return copied;
}

async function writePackageJson(
  outputPath: string,
  manifestPath: string | undefined,
  setCount: number,
  imageCount: number,
  dryRun: boolean,
): Promise<void> {
  const packageInfo = {
    version: 'as-served-only',
    date: new Date().toISOString(),
    modules: ['as-served-images'],
    manifest: manifestPath ? path.basename(manifestPath) : null,
    setCount,
    imageCount,
    generatedBy: '@intake24/food-tools:generate-as-served-package',
  };

  if (dryRun)
    return;

  await writeFile(
    path.join(outputPath, 'package.json'),
    `${JSON.stringify(packageInfo, null, 2)}\n`,
    'utf-8',
  );
}

async function writeAsServedJson(
  outputPath: string,
  manifests: AsServedSetManifest[],
  dryRun: boolean,
): Promise<void> {
  if (dryRun)
    return;

  const portionSizeDir = path.join(outputPath, 'portion-size');
  await ensureDirectory(portionSizeDir);

  const payload = manifests.map((manifest) => {
    const images = manifest.images.map(image => ({
      imagePath: path.posix.join('as-served', manifest.id, image.fileName),
      imageKeywords: [] as string[],
      weight: image.weight,
    }));

    const selectionImagePath = images[Math.floor(images.length / 2)]!.imagePath;

    return {
      id: manifest.id,
      description: manifest.description,
      selectionImagePath,
      images,
    };
  });

  await writeFile(
    path.join(portionSizeDir, 'as-served.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf-8',
  );
}

async function prepareOutputDirectory(
  outputPath: string,
  cleanOutput: boolean,
  dryRun: boolean,
): Promise<void> {
  if (dryRun)
    return;

  if (cleanOutput)
    await rm(outputPath, { recursive: true, force: true }).catch(() => {});

  await ensureDirectory(outputPath);
  await ensureDirectory(path.join(outputPath, 'images', 'as-served'));
  await ensureDirectory(path.join(outputPath, 'portion-size'));
}

export default async function generateAsServedPackageCommand(
  options: GenerateAsServedPackageOptions,
): Promise<void> {
  const mode = options.mode ?? (options.manifestPath ? 'manifest' : 'folders');
  let manifests: AsServedSetManifest[] = [];
  const manifestPath = options.manifestPath ? path.resolve(options.manifestPath) : undefined;

  if (mode === 'manifest') {
    if (!manifestPath)
      throw new Error('Manifest mode selected but no manifestPath provided');

    if (!(await pathExists(manifestPath)))
      throw new Error(`Manifest file does not exist: ${manifestPath}`);

    const imageRoots = options.imageRoots && options.imageRoots.length > 0
      ? options.imageRoots
      : [path.dirname(manifestPath)];

    const candidateParents = await collectCandidateParents(imageRoots);
    if (candidateParents.length === 0)
      throw new Error('No candidate image directories were discovered');

    logger.info(`Found ${candidateParents.length} candidate directories for image lookup`);

    manifests = await buildAsServedManifest(manifestPath, candidateParents);
  }
  else {
    if (!options.folderRoots || options.folderRoots.length === 0)
      throw new Error('Folder mode selected but no folderRoots provided');

    manifests = await buildAsServedManifestFromFolders({
      folderRoots: options.folderRoots,
      setIdPrefix: options.setIdPrefix,
      trimSuffix: options.trimSuffix,
    });
  }

  if (manifests.length === 0)
    throw new Error('No as-served sets were resolved from the supplied inputs');

  const outputPath = path.resolve(options.outputPath);
  const dryRun = options.dryRun ?? false;

  await prepareOutputDirectory(outputPath, options.cleanOutput ?? false, dryRun);

  const totalImages = manifests.reduce((acc, manifest) => acc + manifest.images.length, 0);

  const imagesCopied = await copyImages(
    manifests,
    path.join(outputPath, 'images', 'as-served'),
    dryRun,
    options.overwriteExistingImages ?? true,
  );

  await writeAsServedJson(outputPath, manifests, dryRun);
  await writePackageJson(outputPath, manifestPath, manifests.length, totalImages, dryRun);

  const sourceDescription
    = mode === 'manifest'
      ? `manifest ${manifestPath ? path.basename(manifestPath) : ''}`.trim()
      : `${options.folderRoots?.length ?? 0} folder root(s)`;

  logger.info(
    `Resolved ${manifests.length} as-served set(s) (${totalImages} images total) from ${sourceDescription}`,
  );
  logger.info(
    dryRun
      ? 'Dry run complete – no files were written.'
      : `Package generated at ${outputPath} (${imagesCopied} image file(s) copied)`,
  );
}
