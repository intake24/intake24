import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { RequiredLocaleTranslation } from '@intake24/common/types';
import type { DrinkwareScaleEntry, DrinkwareScaleV2Entry } from '@intake24/common/types/http/admin';

import { access, stat } from 'node:fs/promises';
import path from 'node:path';

import { format as formatDate } from 'date-fns';
import ExcelJS from 'exceljs';
import sharp from 'sharp';

import { NotFoundError } from '@intake24/api/http/errors';
import { addTime } from '@intake24/api/util';
import { Job as DbJob } from '@intake24/db';

import BaseJob from '../job';

const MAX_IMAGE_WIDTH = 400;
// Excel caps row height at 409pt, which is ~545px
const MAX_IMAGE_HEIGHT = 540;
const JPEG_QUALITY = 80;
const STANDARD_UNITS_LOCALE_ID = 'UK_current';
const IMAGE_COLUMN = 3;

type ImageSetRow = {
  id: string;
  description: string;
  imagePath: string | null;
  count: number;
  values: number[];
  notes: string[];
};

type ValueColumnHeaders = {
  count: string;
  min: string;
  max: string;
};

type ResizedImage = {
  buffer: Buffer;
  width: number;
  height: number;
};

export default class PortionSizeImageCatalogExport extends BaseJob<'PortionSizeImageCatalogExport'> {
  readonly name = 'PortionSizeImageCatalogExport';

  private dbJob!: DbJob;

  private readonly fsConfig;
  private readonly kyselyDb;
  private readonly drinkwareSetService;

  constructor({ fsConfig, kyselyDb, drinkwareSetService, logger }: Pick<IoC, 'fsConfig' | 'kyselyDb' | 'drinkwareSetService' | 'logger'>) {
    super({ logger });

    this.fsConfig = fsConfig;
    this.kyselyDb = kyselyDb;
    this.drinkwareSetService = drinkwareSetService;
  }

  public async run(job: Job): Promise<void> {
    this.init(job);

    const dbJob = await DbJob.findByPk(this.dbId);
    if (!dbJob)
      throw new NotFoundError(`Job ${this.name}: Job record not found (${this.dbId}).`);

    this.dbJob = dbJob;

    this.logger.debug('Job started.');

    await this.export();

    this.logger.debug('Job finished.');
  }

  private async export(): Promise<void> {
    const asServedRows = await this.getAsServedRows();
    const guideImageRows = await this.getGuideImageRows();
    const drinkwareRows = await this.getDrinkwareRows();
    const standardUnits = await this.kyselyDb.foods
      .selectFrom('standardUnits')
      .select([
        'code',
        'name',
        'estimateIn',
        'howMany',
      ])
      .where('localeId', '=', STANDARD_UNITS_LOCALE_ID)
      .orderBy('code')
      .execute();

    this.initProgress(asServedRows.length + guideImageRows.length + drinkwareRows.length);

    const workbook = new ExcelJS.Workbook();

    await this.writeImageSetSheet(workbook, 'As served', 'As served set ID', {
      count: 'Image count',
      min: 'Min weight (g)',
      max: 'Max weight (g)',
    }, asServedRows);
    await this.writeImageSetSheet(workbook, 'Guide images', 'Guide image ID', {
      count: 'Object count',
      min: 'Min weight (g)',
      max: 'Max weight (g)',
    }, guideImageRows);
    await this.writeImageSetSheet(workbook, 'Drink scales', 'Drinkware set ID', {
      count: 'Container count',
      min: 'Smallest container volume (ml)',
      max: 'Largest container volume (ml)',
    }, drinkwareRows);
    this.writeStandardUnitsSheet(workbook, standardUnits);

    this.logMemoryUsage('Workbook built');

    const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `intake24-portion-size-image-catalog-${timestamp}.xlsx`;
    const filePath = path.resolve(this.fsConfig.local.downloads, filename);

    await workbook.xlsx.writeFile(filePath);

    const { size } = await stat(filePath);
    this.logMemoryUsage(`Workbook written (${(size / 1024 / 1024).toFixed(1)} MB)`);

    await this.dbJob.update({
      downloadUrl: filename,
      downloadUrlExpiresAt: addTime(this.fsConfig.urlExpiresAt),
    });
  }

  private logMemoryUsage(stage: string) {
    const { rss, heapUsed, external, arrayBuffers } = process.memoryUsage();
    const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    this.logger.info(`${stage}: rss ${mb(rss)}, heapUsed ${mb(heapUsed)}, external ${mb(external)}, arrayBuffers ${mb(arrayBuffers)}`);
  }

  private async getAsServedRows(): Promise<ImageSetRow[]> {
    const sets = await this.kyselyDb.foods
      .selectFrom('asServedSets')
      .select(['id', 'description'])
      .orderBy('id')
      .execute();

    const images = await this.kyselyDb.foods
      .selectFrom('asServedImages')
      .leftJoin('processedImages', 'processedImages.id', 'asServedImages.imageId')
      .leftJoin('sourceImages', 'sourceImages.id', 'processedImages.sourceId')
      .select(['asServedImages.asServedSetId', 'asServedImages.weight', 'sourceImages.path as sourcePath'])
      .orderBy('asServedImages.weight')
      .execute();

    const imagesBySet = groupBy(images, image => image.asServedSetId);

    return sets.map((set) => {
      const setImages = imagesBySet.get(set.id) ?? [];
      const middleImage = setImages.at(Math.floor((setImages.length - 1) / 2));
      const weights = setImages.map(image => image.weight);

      if (!middleImage)
        return imageSetRow(set, null, weights, ['As served set has no images']);

      return imageSetRow(set, middleImage.sourcePath, weights);
    });
  }

  private async getGuideImageRows(): Promise<ImageSetRow[]> {
    const guideImages = await this.kyselyDb.foods
      .selectFrom('guideImages')
      .leftJoin('imageMaps', 'imageMaps.id', 'guideImages.imageMapId')
      .leftJoin('processedImages', 'processedImages.id', 'imageMaps.baseImageId')
      .leftJoin('sourceImages', 'sourceImages.id', 'processedImages.sourceId')
      .select(['guideImages.id', 'guideImages.description', 'sourceImages.path as sourcePath'])
      .orderBy('guideImages.id')
      .execute();

    const objects = await this.kyselyDb.foods
      .selectFrom('guideImageObjects')
      .select(['guideImageId', 'weight'])
      .orderBy('weight')
      .execute();

    const objectsByGuideImage = groupBy(objects, object => object.guideImageId);

    return guideImages.map(({ sourcePath, ...guideImage }) => imageSetRow(
      guideImage,
      sourcePath,
      (objectsByGuideImage.get(guideImage.id) ?? []).map(object => object.weight),
    ));
  }

  private async getDrinkwareRows(): Promise<ImageSetRow[]> {
    const sets = await this.kyselyDb.foods
      .selectFrom('drinkwareSets')
      .leftJoin('imageMaps', 'imageMaps.id', 'drinkwareSets.imageMapId')
      .leftJoin('processedImages', 'processedImages.id', 'imageMaps.baseImageId')
      .leftJoin('sourceImages', 'sourceImages.id', 'processedImages.sourceId')
      .select(['drinkwareSets.id', 'drinkwareSets.description', 'sourceImages.path as imagePath'])
      .orderBy('drinkwareSets.id')
      .execute();

    const rows: ImageSetRow[] = [];

    for (const set of sets) {
      const { scales } = await this.drinkwareSetService.getDrinkwareSetOrThrow(set.id);
      const sortedScales = scales.toSorted((a, b) => Number(a.choiceId) - Number(b.choiceId));

      const row: ImageSetRow = {
        ...set,
        count: scales.length,
        values: [],
        notes: set.imagePath === null
          ? ['Source image record is missing']
          : [],
      };

      for (const scale of sortedScales) {
        const maxVolume = getMaxVolume(scale);
        if (maxVolume === undefined)
          row.notes.push(`Container ${scale.choiceId} has no volume samples`);
        else
          row.values.push(Math.round(maxVolume));
      }

      rows.push(row);
    }

    return rows;
  }

  private async resizeImage(relativePath: string): Promise<ResizedImage | undefined> {
    const sourcePath = path.join(this.fsConfig.local.images, relativePath);

    try {
      await access(sourcePath);
    }
    catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT')
        return undefined;
      throw err;
    }

    const { data, info } = await sharp(sourcePath)
      .resize({
        width: MAX_IMAGE_WIDTH,
        height: MAX_IMAGE_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer({ resolveWithObject: true });

    return { buffer: data, width: info.width, height: info.height };
  }

  private async writeImageSetSheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    idHeader: string,
    valueHeaders: ValueColumnHeaders,
    rows: ImageSetRow[],
  ): Promise<void> {
    const sheet = workbook.addWorksheet(sheetName, {
      views: [
        { state: 'frozen', ySplit: 1 },
      ],
    });
    sheet.columns = [
      { header: idHeader, width: 24 },
      { header: 'Description', width: 40 },
      {
        header: 'Image',
        width: pixelsToColumnWidth(MAX_IMAGE_WIDTH),
      },
      { header: valueHeaders.count, width: 16 },
      { header: valueHeaders.min, width: 30 },
      { header: valueHeaders.max, width: 30 },
      { header: 'Notes', width: 50 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const row of rows) {
      const notes = [...row.notes];

      const image = row.imagePath === null
        ? undefined
        : await this.resizeImage(row.imagePath);
      if (!image && row.imagePath !== null)
        notes.unshift(`Image file not found: ${row.imagePath}`);

      const excelRow = sheet.addRow([
        row.id,
        row.description,
        null,
        row.count,
        row.values.length
          ? Math.min(...row.values)
          : null,
        row.values.length
          ? Math.max(...row.values)
          : null,
        notes.join('; '),
      ]);
      excelRow.alignment = { vertical: 'top', wrapText: true };

      if (image) {
        excelRow.height = pixelsToPoints(image.height);
        const imageId = workbook.addImage({ buffer: image.buffer as unknown as ExcelJS.Buffer, extension: 'jpeg' });
        sheet.addImage(imageId, {
          tl: { col: IMAGE_COLUMN - 1, row: excelRow.number - 1 },
          ext: { width: image.width, height: image.height },
          editAs: 'oneCell',
        });
      }

      await this.incrementProgress(1);
    }
  }

  private writeStandardUnitsSheet(
    workbook: ExcelJS.Workbook,
    units: { code: string; name: string; estimateIn: RequiredLocaleTranslation; howMany: RequiredLocaleTranslation }[],
  ): void {
    const languages = [
      ...new Set(units.flatMap(unit => [
        ...Object.keys(unit.estimateIn),
        ...Object.keys(unit.howMany),
      ])),
    ]
      .toSorted((a, b) => a === 'en'
        ? -1
        : b === 'en'
          ? 1
          : a.localeCompare(b));

    const sheet = workbook.addWorksheet('Standard units', {
      views: [
        { state: 'frozen', ySplit: 1 },
      ],
    });
    sheet.columns = [
      { header: 'Standard unit ID', width: 30 },
      { header: 'Name', width: 30 },
      ...languages.map(lang => ({ header: `Estimate in (${lang})`, width: 30 })),
      ...languages.map(lang => ({ header: `How many (${lang})`, width: 30 })),
    ];
    sheet.getRow(1).font = { bold: true };

    for (const unit of units) {
      sheet.addRow([
        unit.code,
        unit.name,
        ...languages.map(lang => unit.estimateIn[lang] ?? null),
        ...languages.map(lang => unit.howMany[lang] ?? null),
      ]);
    }
  }
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const group = grouped.get(key(item));
    if (group)
      group.push(item);
    else
      grouped.set(key(item), [item]);
  }
  return grouped;
}

function imageSetRow(
  set: { id: string; description: string },
  imagePath: string | null,
  weights: number[],
  notes: string[] = [],
): ImageSetRow {
  return {
    ...set,
    imagePath,
    count: weights.length,
    values: weights,
    notes: imagePath === null && !notes.length
      ? ['Source image record is missing']
      : notes,
  };
}

// Both versions store volume samples as flattened [fill, volume, fill, volume, ...] pairs
function getMaxVolume(scale: DrinkwareScaleEntry | DrinkwareScaleV2Entry): number | undefined {
  const samples = scale.version === 1
    ? scale.volumeSamples
    : scale.volumeSamplesNormalised;

  let max: number | undefined;
  for (let i = 1; i < (samples?.length ?? 0); i += 2) {
    if (max === undefined || samples[i] > max)
      max = samples[i];
  }
  return max;
}

function pixelsToPoints(px: number): number {
  return px * 0.75;
}

// Approximation for the default Calibri 11 font: 7px per character plus 5px padding
function pixelsToColumnWidth(px: number): number {
  return Math.ceil((px - 5) / 7) + 1;
}
