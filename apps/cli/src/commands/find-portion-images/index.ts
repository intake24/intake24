import type Config from './config';

import { readFileSync } from 'node:fs';

import { createArrayCsvWriter } from 'csv-writer';
import { logger } from '@intake24/common-backend';
import type { PortionSizeParameters } from '@intake24/common/surveys';
import type { Environment } from '@intake24/common/types';

import {
  AsServedImage,
  AsServedSet,
  Database,
  databaseConfig,
  Food,

  FoodNutrient,
  FoodPortionSizeMethod,
  FoodsNutrientType,
  FoodsNutrientUnit,
  GuideImage,
  GuideImageObject,
  ImageMap,
  ImageMapObject,
  NutrientTableRecord,
  NutrientTableRecordNutrient,
  ProcessedImage,
} from '@intake24/db';
import validate from './config.validator';

const energyKcalNutrientType = '1';

interface AsServedImageData {
  asServedSetId: string;
  imageWeight: number;
  imagePath: string;
}

class AsServedHelper {
  private sets?: AsServedSet[];

  async init() {
    this.sets = await AsServedSet.findAll({
      include: [
        {
          model: AsServedImage,
          include: [{ model: ProcessedImage, as: 'image' }],
        },
      ],
    });
  }

  private getSetById(id: string): AsServedSet | undefined {
    if (this.sets) {
      for (const set of this.sets) {
        if (set.id === id)
          return set;
      }
    }
    return undefined;
  }

  findClosestPortionSize(asServedSetId: string, weight: number): AsServedImageData | undefined {
    const set = this.getSetById(asServedSetId);

    if (set && set.asServedImages && set.asServedImages.length > 0) {
      let best = 0;

      for (let i = 1; i < set.asServedImages.length; ++i) {
        if (
          Math.abs(weight - set.asServedImages[i].weight)
          < Math.abs(weight - set.asServedImages[best].weight)
        ) {
          best = i;
        }
      }

      const { image } = set.asServedImages[best];

      if (image) {
        return {
          asServedSetId,
          imageWeight: set.asServedImages[best].weight,
          imagePath: image.path,
        };
      }
    }

    return undefined;
  }
}

interface GuideImageData {
  guideImageId: string;
  imageWeight: number;
  guideImagePath: string;
  objectId: string;
  coordinates: [number, number, number, number];
  overlayImagePath: string;
}

class GuideImageHelper {
  private guideImages?: GuideImage[];

  private readonly guideImageWidth: number;

  constructor(guideImageWidth: number) {
    this.guideImageWidth = guideImageWidth;
  }

  async init() {
    this.guideImages = await GuideImage.findAll({
      include: [
        {
          model: ImageMap,
          include: [{ model: ImageMapObject, include: [ProcessedImage] }, ProcessedImage],
        },
        GuideImageObject,
      ],
    });
  }

  getImageById(id: string): GuideImage | undefined {
    if (this.guideImages)
      return this.guideImages.find(gi => gi.id === id);

    return undefined;
  }

  findClosestPortionSize(guideImageId: string, weight: number): GuideImageData | undefined {
    const guideImage = this.getImageById(guideImageId);

    if (
      guideImage
      && guideImage.objects
      && guideImage.objects.length > 0
      && guideImage.imageMap
      && guideImage.imageMap.objects
    ) {
      let best = 0;

      for (let i = 1; i < guideImage.objects.length; ++i) {
        if (
          Math.abs(weight - guideImage.objects[i].weight)
          < Math.abs(weight - guideImage.objects[best].weight)
        ) {
          best = i;
        }
      }

      const guideImageObject = guideImage.objects[best]!;

      console.log('best guide image object:');
      console.log(JSON.stringify(guideImageObject));

      const imageMapObject = guideImage.imageMap.objects.find(
        obj => obj.id === guideImageObject.imageMapObjectId,
      );

      console.log('image map object:');
      console.log(JSON.stringify(imageMapObject));

      if (imageMapObject && guideImage.imageMap.baseImage && imageMapObject.overlayImage) {
        return {
          guideImageId,
          imageWeight: guideImageObject.weight,
          guideImagePath: guideImage.imageMap.baseImage?.path,
          objectId: guideImageObject.imageMapObjectId,
          overlayImagePath: imageMapObject.overlayImage?.path,
          coordinates: GuideImageHelper.calculateObjectRect(
            imageMapObject.outlineCoordinates,
            this.guideImageWidth,
          ),
        };
      }
    }

    return undefined;
  }

  static calculateObjectRect(
    coordinates: number[],
    width: number,
  ): [number, number, number, number] {
    let maxX = coordinates[0];
    let maxY = coordinates[1];
    let minX = coordinates[0];
    let minY = coordinates[1];

    for (let i = 2; i < coordinates.length; i += 2) {
      minX = Math.min(coordinates[i], minX);
      maxX = Math.max(coordinates[i], maxX);
      minY = Math.min(coordinates[i + 1], minY);
      maxY = Math.max(coordinates[i + 1], maxY);
    }

    return [
      Math.round(minX * width),
      Math.round(minY * width),
      Math.round(maxX * width),
      Math.round(maxY * width),
    ];
  }
}

interface ImageDataWithNutrients<T> {
  imageData: T;
  adjustedWeight: number;
  nutrients: (number | undefined)[];
}

interface PortionSizeImages {
  food: {
    code: string;
    name: string;
  };
  composition: {
    fct: string;
    recordId: string;
    recordName: string;
  };
  asServedImages: ImageDataWithNutrients<AsServedImageData>[];
  guideImages: ImageDataWithNutrients<GuideImageData>[];
}

async function getNutrientLabels(ids: string[]): Promise<Map<string, string>> {
  const nutrientLabels = new Map<string, string>();

  const records = await FoodsNutrientType.findAll({
    include: [{ model: FoodsNutrientUnit }],
    where: { id: ids },
  });

  for (const id of ids) {
    const record = records.find(r => r.id === id);

    if (!record)
      throw new Error(`Nutrient type ${id} is not in the database`);

    nutrientLabels.set(id, `${record.description}, ${record.unit?.symbol}`);
  }

  return nutrientLabels;
}

function calculateNutrients(
  weight: number,
  nutrientIds: string[],
  databaseRecord: NutrientTableRecord,
): (number | undefined)[] {
  return nutrientIds.map((id) => {
    const nutrientData = databaseRecord.nutrients?.find(n => n.nutrientTypeId === id);
    if (nutrientData)
      return (nutrientData.unitsPer100g / 100.0) * weight;

    console.log(
      `Nutrient data missing for nutrient ${id} in ${databaseRecord.nutrientTableId}, record id ${databaseRecord.nutrientTableRecordId}`,
    );
    return undefined;
  });
}

async function findPortionSizeImages(
  config: Config,
  nutrientIds: string[],
): Promise<PortionSizeImages[]> {
  const asServedHelper = new AsServedHelper();
  await asServedHelper.init();

  const guideHelper = new GuideImageHelper(config.guideImageWidth);
  await guideHelper.init();

  const portionSizeImages: PortionSizeImages[] = [];

  let offset = 0;

  while (true) {
    const currentBatch = await Food.findAll({
      where: {
        localeId: config.locale,
        ...(config.foodFilter.length > 0 ? { code: config.foodFilter } : {}),
      },
      include: [
        {
          model: FoodPortionSizeMethod,
          separate: true,
          required: false,
        },
        {
          model: FoodNutrient,
          separate: true,
          include: [
            {
              model: NutrientTableRecord,
              include: [NutrientTableRecordNutrient],
            },
          ],
        },
      ],
      order: ['code'],
      limit: config.batchSize,
      offset,
    });

    for (let i = 0; i < currentBatch.length; ++i) {
      const food = currentBatch[i];

      console.log(currentBatch[i].code, food.name);

      const nutrientMapping = food.nutrientMappings?.[0];

      if (!nutrientMapping) {
        console.log(`Nutrient mapping is undefined for food ${currentBatch[i].code}, skipping`);
        continue;
      }

      if (!food.portionSizeMethods) {
        console.log(
          `Portion size methods are undefined for food ${currentBatch[i].code}, skipping`,
        );
        continue;
      }

      const energyKcalRecord
          = nutrientMapping.nutrientTableRecord?.getNutrientByType(energyKcalNutrientType);

      if (!energyKcalRecord) {
        console.log(`No energy (kcal) available for food ${currentBatch[i].code}, skipping`);
        continue;
      }

      console.log(
        nutrientMapping.nutrientTableRecord?.nutrientTableId,
        nutrientMapping.nutrientTableRecord?.nutrientTableRecordId,
      );
      console.log(`${energyKcalRecord.unitsPer100g} calories per 100g`);

      const asServedImages: ImageDataWithNutrients<AsServedImageData>[] = [];
      const guideImages: ImageDataWithNutrients<GuideImageData>[] = [];

      for (const psm of food.portionSizeMethods) {
        const targetWeight = (config.energyValueKcal * 100.0) / energyKcalRecord.unitsPer100g;

        if (psm.method === 'as-served') {
          const asServedSetId = (psm.parameters as PortionSizeParameters['as-served'])
            .servingImageSet;

          if (!asServedSetId) {
            console.log(
              `Portion size method ${psm.id} for ${food.code} has no "serving-image-set" parameter`,
            );
            continue;
          }

          if (
            config.portionSizeFilter.length > 0
            && !config.portionSizeFilter.includes(asServedSetId)
          ) {
            continue;
          }

          const asServedImageData = asServedHelper.findClosestPortionSize(
            asServedSetId,
            targetWeight / psm.conversionFactor,
          );

          if (asServedImageData) {
            asServedImages.push({
              imageData: asServedImageData,
              adjustedWeight: asServedImageData.imageWeight * psm.conversionFactor,
              nutrients: calculateNutrients(
                asServedImageData.imageWeight * psm.conversionFactor,
                nutrientIds,
                nutrientMapping.nutrientTableRecord!,
              ),
            });
          }
        }

        if (psm.method === 'guide-image') {
          const guideImageId = (psm.parameters as PortionSizeParameters['guide-image'])
            .guideImageId;

          if (!guideImageId) {
            console.log(
              `Portion size method ${psm.id} for ${food.code} has no "guide-image-id" parameter`,
            );
            continue;
          }

          if (
            config.portionSizeFilter.length > 0
            && !config.portionSizeFilter.includes(guideImageId)
          ) {
            continue;
          }

          const guideImageData = guideHelper.findClosestPortionSize(
            guideImageId,
            targetWeight / psm.conversionFactor,
          );

          if (guideImageData) {
            guideImages.push({
              imageData: guideImageData,
              adjustedWeight: guideImageData.imageWeight * psm.conversionFactor,
              nutrients: calculateNutrients(
                guideImageData.imageWeight * psm.conversionFactor,
                nutrientIds,
                nutrientMapping.nutrientTableRecord!,
              ),
            });
          }
        }
      }

      portionSizeImages.push({
        food: {
          code: food.code,
          name: food.name ?? food.englishName,
        },
        composition: {
          fct: nutrientMapping.nutrientTableRecord!.nutrientTableId,
          recordId: nutrientMapping.nutrientTableRecord!.nutrientTableRecordId,
          recordName: nutrientMapping.nutrientTableRecord!.name,
        },
        asServedImages,
        guideImages,
      });
    }

    if (currentBatch.length === 0)
      break;

    offset += currentBatch.length;
  }

  return portionSizeImages;
}

async function main(config: Config, outputFilePath: string) {
  const db = new Database({
    databaseConfig,
    logger,
    environment: (process.env.NODE_ENV || 'development') as Environment,
  });

  await db.init();

  const nutrientIds = (await FoodsNutrientType.findAll({ order: ['id'] })).map(r => r.id);

  const [nutrientLabels, portionSizeImages] = await Promise.all([
    getNutrientLabels(nutrientIds),
    findPortionSizeImages(config, nutrientIds),
  ]);

  const writer = createArrayCsvWriter({ path: outputFilePath });

  const header = [
    'Intake24 food code',
    'Intake24 food name',
    'Portion size method',
    'As serving set/guide image ID',
    'Weight (image), g',
    'Weight (adjusted), g',
    'As served image path',
    'Guide image path',
    'Guide object id',
    'Guide overlay path',
    'Guide object area',
    'FCT',
    'FCT record id',
    'FCT food name',
  ];

  for (const nutrientId of nutrientIds) header.push(nutrientLabels.get(nutrientId)!);

  await writer.writeRecords([header]);

  for (const psi of portionSizeImages) {
    const rows = [];

    for (const as of psi.asServedImages) {
      const columns = [
        psi.food.code,
        psi.food.name,
        'as-served',
        as.imageData.asServedSetId,
        as.imageData.imageWeight,
        as.adjustedWeight,
        as.imageData.imagePath,
        undefined,
        undefined,
        undefined,
        undefined,
        psi.composition.fct,
        psi.composition.recordId,
        psi.composition.recordName,
      ];

      columns.push(...as.nutrients);

      rows.push(columns);
    }

    for (const gi of psi.guideImages) {
      const columns = [
        psi.food.code,
        psi.food.name,
        'guide-image',
        gi.imageData.guideImageId,
        gi.imageData.imageWeight,
        gi.adjustedWeight,
        undefined,
        gi.imageData.guideImagePath,
        gi.imageData.objectId,
        gi.imageData.overlayImagePath,
        `${gi.imageData.coordinates[0]}, ${gi.imageData.coordinates[1]}, ${gi.imageData.coordinates[2]}, ${gi.imageData.coordinates[3]}`,
        psi.composition.fct,
        psi.composition.recordId,
        psi.composition.recordName,
      ];

      columns.push(...gi.nutrients);

      rows.push(columns);
    }

    if (rows.length)
      await writer.writeRecords(rows);
  }

  await db.close();
}

export type FindPortionImagesArgs = { config: string; output: string };

export default async (cmd: FindPortionImagesArgs): Promise<void> => {
  const fileContents = readFileSync(cmd.config, { encoding: 'utf8' });
  const config = validate(JSON.parse(fileContents));

  const now = new Date();
  const timeStamp = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now.getFullYear()}`;
  const outputFilePath
    = cmd.output || `${config.energyValueKcal}kcal-${config.locale}-${timeStamp}.csv`;

  await main(config, outputFilePath);
};
