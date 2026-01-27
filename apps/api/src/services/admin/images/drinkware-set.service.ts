import type { Expression, Kysely, SqlBool } from 'kysely';

import type { IoC } from '@intake24/api/ioc';
import type { Dictionary, LocaleTranslation } from '@intake24/common/types';
import type {
  CreateDrinkwareSetInput,
  DrinkwareScaleEntry,
  DrinkwareScaleV2Entry,
  DrinkwareScaleVolumeMethod,
  DrinkwareSetEntry,
  DrinkwareSetsResponse,
  ImageMulterFile,
  UpdateDrinkwareSetInput,
} from '@intake24/common/types/http/admin';
import type { FoodsDB, JsonValue, PaginateQuery, ProcessedImage } from '@intake24/db';

import path from 'node:path';

import { groupBy, mapValues } from 'lodash-es';

import { ApplicationError, NotFoundError } from '@intake24/api/http/errors';
import { translateSqlErrors } from '@intake24/api/util/sequelize-errors';
import { DrinkwareSet, executeWithPagination } from '@intake24/db';

export type UpdateDrinkwareSetInputWithFiles = UpdateDrinkwareSetInput & {
  baseImageFiles: Dictionary<ImageMulterFile>;
};

function drinkwareSetService({
  kyselyDb,
  imagesBaseUrl,
  sourceImageService,
  processedImageService,
  fsConfig,
}: Pick<
  IoC,
  | 'kyselyDb'
  | 'imagesBaseUrl'
  | 'sourceImageService'
  | 'processedImageService'
  | 'fsConfig'
>) {
  const { images: imagesPath } = fsConfig.local;

  function getImageUrl(relativeUrl: string): string {
    return `${imagesBaseUrl}/${relativeUrl}`;
  }

  function parseLocaleTranslation(text: JsonValue): LocaleTranslation {
    return (text ?? {}) as LocaleTranslation;
  }

  function parseFloatArray(value: JsonValue, sourceFieldName: string): number[] {
    if (!Array.isArray(value)) {
      throw new TypeError(
        `Expected a JSON array in field ${sourceFieldName}, but received ${typeof value}`,
      );
    }

    for (const v of value) {
      if (typeof v !== 'number') {
        throw new TypeError(
          `Expected an array of numbers in field ${sourceFieldName}, but encountered element of type ${typeof v}`,
        );
      }
    }

    return value as number[];
  }

  async function checkSetId(setId: string, transaction?: Kysely<FoodsDB>): Promise<void> {
    const records = await (transaction ?? kyselyDb.foods)
      .selectFrom('drinkwareSets')
      .select('drinkwareSets.id')
      .where('drinkwareSets.id', '=', setId)
      .execute();

    if (records.length === 0)
      throw new NotFoundError(`Drinkware set "${setId}" not found`);
  }

  const create = async (input: CreateDrinkwareSetInput): Promise<void> => {
    // This is wasteful and incorrect (race condition)
    // Should handle the SQL foreign key error code instead
    await kyselyDb.foods
      .selectFrom('imageMaps')
      .where('id', '=', input.imageMapId)
      .executeTakeFirstOrThrow(
        _ => new ApplicationError(`Image map ${input.imageMapId} does not exist.`),
      );

    await translateSqlErrors(() =>
      kyselyDb.foods
        .insertInto('drinkwareSets')
        .values(input)
        .execute(),
    );
  };

  async function convertV1BaseImage(
    drinkwareSetId: string,
    imageUploaderId: string,
    imagePath: string,
  ): Promise<string> {
    const image = await processDrinkScaleImage(
      drinkwareSetId,
      imageUploaderId,
      path.join(imagesPath, imagePath),
    );
    return image.id;
  }

  /*
  This is probably more complicated than it needs to be...

  This function handles the following cases:

  1) Update existing scale data (optionally including uploading new base image)

  2) Create new scale data record

  3) Convert legacy data to the new format, including processing the old base image
     using the standard image processing pipeline.
   */
  const update = async (
    drinkwareSetId: string,
    imageUploaderId: string,
    input: UpdateDrinkwareSetInputWithFiles,
  ): Promise<void> => {
    await kyselyDb.foods.transaction().execute(async (tx) => {
      // Update the drinkware set record
      await tx
        .selectFrom('imageMaps')
        .where('id', '=', input.imageMapId)
        .executeTakeFirstOrThrow(
          () => new ApplicationError(`Image map ${input.imageMapId} does not exist.`),
        );

      const { numUpdatedRows } = await tx
        .updateTable('drinkwareSets')
        .set({
          description: input.description,
          imageMapId: input.imageMapId,
          label: input.label,
        })
        .where('drinkwareSets.id', '=', drinkwareSetId)
        .executeTakeFirst();

      if (numUpdatedRows !== 1n)
        throw new NotFoundError(`Drinkware set ${drinkwareSetId} not found`);

      // Update the sliding scales

      const scaleChoiceIds = Object.keys(input.scales);

      if (scaleChoiceIds.length > 0) {
        const legacyScales = await getDrinkScalesV1(drinkwareSetId, true, tx);
        const existingScalesV2 = await getDrinkScaleV2ChoiceIds(drinkwareSetId, tx);

        for (const choiceId of scaleChoiceIds) {
          const scaleInput = input.scales[choiceId];

          if (existingScalesV2.includes(choiceId)) {
            await updateDrinkScaleV2(
              drinkwareSetId,
              choiceId,
              imageUploaderId,
              input.baseImageFiles[choiceId],
              scaleInput.label,
              scaleInput.outlineCoordinates,
              scaleInput.volumeSamples,
              scaleInput.volumeMethod,
              tx,
            );
          }
          else {
            // If V1 scale exists, use its values as defaults
            const v1 = legacyScales.find(scale => scale.choiceId.toString() === choiceId);

            // If new base image was not uploaded, run the legacy base image through the standard
            // image processing pipeline
            const baseImage
              = input.baseImageFiles[choiceId]
                ?? (v1
                  ? await convertV1BaseImage(drinkwareSetId, imageUploaderId, v1.baseImageUrl)
                  : undefined);

            if (baseImage === undefined) {
              throw new ApplicationError(
                `Drink scale for choice id ${choiceId} does not exist; an image is required to create a new scale record and it is missing from input.`,
              );
            }

            const volumeSamples = scaleInput.volumeSamples ?? (v1 ? v1.volumeSamples : []);

            const volumeMethod = scaleInput.volumeMethod ?? 'lookUpTable';

            const label = scaleInput.label ?? (v1 ? v1.label : {});

            await createDrinkScaleV2(
              drinkwareSetId,
              choiceId,
              imageUploaderId,
              baseImage,
              label,
              scaleInput.outlineCoordinates || [], // V1 does not store outline coordinates, so default to empty
              volumeSamples,
              volumeMethod,
              false,
              tx,
            );
          }
        }
      }
    });
  };

  const destroy = async (drinkwareSetId: string): Promise<void> => {
    const drinkwareSet = await DrinkwareSet.findByPk(drinkwareSetId, { attributes: ['id'] });
    if (!drinkwareSet)
      throw new NotFoundError();

    await drinkwareSet.destroy();
  };

  // #region Legacy drink scale format with pre-rendered overlays

  const fetchDrinkScaleRecords = async (
    drinkwareSetId: string,
    choiceId?: string,
    transaction?: Kysely<FoodsDB>,
  ) => {
    const db = transaction ?? kyselyDb.foods;

    const scaleRecords = await db
      .selectFrom('drinkwareScales')
      .select([
        'id',
        'width',
        'height',
        'emptyLevel',
        'fullLevel',
        'choiceId',
        'baseImageUrl',
        'overlayImageUrl',
        'label',
      ])
      .where((eb) => {
        const terms: Expression<SqlBool>[] = [];

        terms.push(eb('drinkwareSetId', '=', drinkwareSetId));

        if (choiceId !== undefined)
          terms.push(eb('choiceId', '=', choiceId));

        return eb.and(terms);
      })
      .orderBy('choiceId')
      .execute();

    return scaleRecords;
  };

  const fetchVolumeSampleRecords = async (scaleId: string[], transaction?: Kysely<FoodsDB>) => {
    if (scaleId.length === 0)
      return [];

    return await (transaction ?? kyselyDb.foods)
      .selectFrom('drinkwareVolumeSamples')
      .select(['drinkwareScaleId', 'fill', 'volume'])
      .where('drinkwareScaleId', 'in', scaleId)
      .execute();
  };

  const getDrinkScaleV1 = async (
    drinkwareSetId: string,
    choiceId: string,
  ): Promise<DrinkwareScaleEntry | undefined> => {
    await checkSetId(drinkwareSetId);

    const records = await fetchDrinkScaleRecords(drinkwareSetId, choiceId);

    if (records.length === 0)
      return undefined;

    const record = records[0];

    const volumeSampleRecords = await fetchVolumeSampleRecords([record.id]);
    const volumeSamples = volumeSampleRecords.flatMap(r => [r.fill, r.volume]);

    return {
      version: 1,
      label: parseLocaleTranslation(record.label),
      choiceId: record.choiceId,
      width: record.width,
      height: record.height,
      fullLevel: record.fullLevel,
      emptyLevel: record.emptyLevel,
      volumeSamples,
      baseImageUrl: getImageUrl(record.baseImageUrl),
      overlayImageUrl: getImageUrl(record.overlayImageUrl),
    };
  };

  const getDrinkScalesV1 = async (
    drinkwareSetId: string,
    getRelativePaths: boolean = false,
    transaction?: Kysely<FoodsDB>,
  ): Promise<DrinkwareScaleEntry[]> => {
    await checkSetId(drinkwareSetId, transaction);

    const records = await fetchDrinkScaleRecords(drinkwareSetId, undefined, transaction);
    const volumeSampleRecords = await fetchVolumeSampleRecords(
      records.map(r => r.id),
      transaction,
    );

    // Convert from a list of records (scale_id, fill, volume) to a map scale_id -> number[],
    // where the numbers are a flattened list of (fill, volume) pairs

    const volumeSamples = mapValues(
      groupBy(volumeSampleRecords, r => r.drinkwareScaleId),
      grouped => grouped.flatMap(r => [r.fill, r.volume]),
    );

    return records.map(record => ({
      version: 1,
      label: parseLocaleTranslation(record.label),
      choiceId: record.choiceId,
      width: record.width,
      height: record.height,
      fullLevel: record.fullLevel,
      emptyLevel: record.emptyLevel,
      volumeSamples: volumeSamples[record.id],
      baseImageUrl: getRelativePaths ? record.baseImageUrl : getImageUrl(record.baseImageUrl),
      overlayImageUrl: getRelativePaths ? record.baseImageUrl : getImageUrl(record.overlayImageUrl),
    }));
  };

  // #endregion

  // #region V2 drink scale format with client-rendered overlays

  const fetchDrinkScaleV2Records = async (drinkwareSetId: string, choiceId?: string) => {
    const scaleRecords = await kyselyDb.foods
      .selectFrom('drinkwareScalesV2')
      .leftJoin('processedImages', 'processedImages.id', 'drinkwareScalesV2.baseImageId')
      .select([
        'drinkwareScalesV2.id as id',
        'choiceId',
        'outlineCoordinates',
        'volumeSamples',
        'volumeSamplesNormalised',
        'baseImageId',
        'processedImages.path as baseImagePath',
        'drinkwareScalesV2.label',
        'drinkwareScalesV2.volumeMethod',
      ])
      .where((eb) => {
        const terms: Expression<SqlBool>[] = [];

        terms.push(eb('drinkwareSetId', '=', drinkwareSetId));

        if (choiceId !== undefined)
          terms.push(eb('choiceId', '=', choiceId));

        return eb.and(terms);
      })
      .orderBy('choiceId')
      .execute();

    return scaleRecords;
  };

  type DrinkScaleV2Record = {
    choiceId: string;
    baseImageId: string;
    outlineCoordinates: JsonValue;
    volumeSamples: JsonValue;
    volumeSamplesNormalised: JsonValue;
    volumeMethod: string;
    label: JsonValue | null;
    id: string;
    baseImagePath: string | null;
  };

  function parseVolumeMethod(method: string): DrinkwareScaleVolumeMethod {
    switch (method) {
      case 'lookUpTable':
        return method;
      case 'cylindrical':
        return method;
      default:
        throw new Error(`Unexpected value in colume volume_method: ${method}`);
    }
  }

  function formatDrinkScaleV2(
    drinkwareSetId: string,
    record: DrinkScaleV2Record,
  ): DrinkwareScaleV2Entry {
    if (record.baseImagePath === null) {
      throw new Error(
        `Drink scale image missing for drinkware set ${drinkwareSetId}, object id ${record.choiceId}, image id ${record.baseImageId}`,
      );
    }

    return {
      version: 2,
      choiceId: record.choiceId,
      label: parseLocaleTranslation(record.label),
      outlineCoordinates: parseFloatArray(record.outlineCoordinates, 'outline_coordinates'),
      volumeSamples: parseFloatArray(record.volumeSamples, 'volume_samples'),
      volumeSamplesNormalised: parseFloatArray(record.volumeSamplesNormalised, 'volume_samples_normalised'),
      volumeMethod: parseVolumeMethod(record.volumeMethod),
      baseImageUrl: getImageUrl(record.baseImagePath),
    };
  }

  const getDrinkScaleV2ChoiceIds = async (
    drinkwareSetId: string,
    transaction?: Kysely<FoodsDB>,
  ): Promise<string[]> => {
    const db = transaction || kyselyDb.foods;

    const rows = await db
      .selectFrom('drinkwareScalesV2')
      .select('choiceId')
      .where('drinkwareSetId', '=', drinkwareSetId)
      .execute();

    return rows.map(row => row.choiceId);
  };

  const getDrinkScalesV2 = async (drinkwareSetId: string): Promise<DrinkwareScaleV2Entry[]> => {
    await checkSetId(drinkwareSetId);

    const records = await fetchDrinkScaleV2Records(drinkwareSetId);

    return records.map(record => formatDrinkScaleV2(drinkwareSetId, record));
  };

  const getDrinkScaleV2 = async (
    drinkwareSetId: string,
    choiceId: string,
  ): Promise<DrinkwareScaleV2Entry | undefined> => {
    await checkSetId(drinkwareSetId);

    const records = await fetchDrinkScaleV2Records(drinkwareSetId, choiceId);

    if (records.length === 0)
      return undefined;

    return formatDrinkScaleV2(drinkwareSetId, records[0]);
  };

  // #endregion

  const getDrinkScale = async (
    drinkwareSetId: string,
    choiceId: string,
  ): Promise<DrinkwareScaleEntry | DrinkwareScaleV2Entry> => {
    await checkSetId(drinkwareSetId);

    const recordV2 = await getDrinkScaleV2(drinkwareSetId, choiceId);
    if (recordV2)
      return recordV2;

    const recordV1 = await getDrinkScaleV1(drinkwareSetId, choiceId);
    if (recordV1)
      return recordV1;

    throw new NotFoundError(
      `Drinkware set ${drinkwareSetId} has no drink scale for object ${choiceId}`,
    );
  };

  const getDrinkScales = async (
    drinkwareSetId: string,
  ): Promise<(DrinkwareScaleEntry | DrinkwareScaleV2Entry)[]> => {
    await checkSetId(drinkwareSetId);

    const recordsV2 = await getDrinkScalesV2(drinkwareSetId);
    const recordsV1 = await getDrinkScalesV1(drinkwareSetId);

    return [...recordsV2, ...recordsV1];
  };

  const processDrinkScaleImage = async (
    id: string,
    uploader: string,
    fileOrPath: ImageMulterFile | Express.Multer.File | string,
  ): Promise<ProcessedImage> => {
    const sourceImage = await sourceImageService.uploadSourceImage(
      {
        id,
        file:
          typeof fileOrPath === 'string'
            ? {
                path: fileOrPath,
                originalname: path.basename(fileOrPath),
              }
            : fileOrPath,
        uploader,
      },
      'drink_scale',
    );

    const processedImage = await processedImageService.createDrinkScaleBaseImage(id, sourceImage);

    return processedImage;
  };

  const normaliseVolumeSamples = (volumeSamples: number[]): number[] => {
    const sampleCount = Math.floor(volumeSamples.length / 2);

    let maxFillLevel = 0;

    for (let i = 0; i < sampleCount; i++) {
      if (volumeSamples[i * 2] > maxFillLevel)
        maxFillLevel = volumeSamples[i * 2];
    }

    if (maxFillLevel === 0) {
      console.warn(`Volume samples max fill level is 0. Check the drink scale data. `);
      return volumeSamples;
    }

    const normalised: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      normalised[i * 2] = volumeSamples[i * 2] / maxFillLevel;
      normalised[i * 2 + 1] = volumeSamples[i * 2 + 1];
    }

    return normalised;
  };

  const createDrinkScaleV2 = async (
    drinkwareSetId: string,
    choiceId: string,
    uploaderId: string,
    baseImageFile: ImageMulterFile | Express.Multer.File | string,
    label: LocaleTranslation,
    outlineCoordinates: number[],
    volumeSamples: number[],
    volumeMethod: string,
    updateOnConflict: boolean,
    transaction?: Kysely<FoodsDB>,
  ) => {
    const processedImageId
      = typeof baseImageFile === 'string'
        ? baseImageFile
        : (await processDrinkScaleImage(drinkwareSetId, uploaderId, baseImageFile)).id;

    async function executeQueries(db: Kysely<FoodsDB>): Promise<void> {
      if (updateOnConflict) {
        await db
          .deleteFrom('drinkwareScalesV2')
          .where('drinkwareSetId', '=', drinkwareSetId)
          .where('choiceId', '=', choiceId)
          .execute();
      }

      await db
        .insertInto('drinkwareScalesV2')
        .values({
          label,
          choiceId,
          drinkwareSetId,
          baseImageId: processedImageId,
          outlineCoordinates,
          volumeSamples,
          volumeSamplesNormalised: normaliseVolumeSamples(volumeSamples),
          volumeMethod,
        })
        .execute();
    }

    await translateSqlErrors(async () => {
      if (transaction)
        await executeQueries(transaction);
      else await kyselyDb.foods.transaction().execute(async tx => executeQueries(tx));
    });
  };

  const updateDrinkScaleV2 = async (
    drinkwareSetId: string,
    choiceId: string,
    imageUploaderId: string,
    baseImageFile?: ImageMulterFile,
    label?: LocaleTranslation,
    outlineCoordinates?: number[],
    volumeSamples?: number[],
    volumeMethod?: DrinkwareScaleVolumeMethod,
    transaction?: Kysely<FoodsDB>,
  ) => {
    const db = transaction || kyselyDb.foods;

    let query = db
      .updateTable('drinkwareScalesV2')
      .where('drinkwareSetId', '=', drinkwareSetId)
      .where('choiceId', '=', choiceId);

    if (baseImageFile) {
      const processedImage = await processDrinkScaleImage(
        drinkwareSetId,
        imageUploaderId,
        baseImageFile,
      );
      query = query.set('baseImageId', processedImage.id);
    }

    if (volumeSamples) {
      query = query
        .set('volumeSamples', volumeSamples)
        .set('volumeSamplesNormalised', normaliseVolumeSamples(volumeSamples));
    }

    if (label) {
      query = query.set('label', label);
    }

    if (volumeMethod) {
      query = query.set('volumeMethod', volumeMethod);
    }

    if (outlineCoordinates) {
      query = query.set('outlineCoordinates', outlineCoordinates);
    }

    const updateResult = await query.executeTakeFirstOrThrow();
    if (updateResult.numUpdatedRows === 0n)
      throw new NotFoundError();
  };

  const createDrinkScaleV1 = async (
    drinkwareSetId: string,
    choiceId: string,
    uploaderId: string,
    baseImageFile: Express.Multer.File,
    overlayImageFile: Express.Multer.File,
    label: LocaleTranslation,
    width: string,
    height: string,
    fullLevel: string,
    emptyLevel: string,
    volumeSamples: { fill: number; volume: number }[],
    update: boolean,
  ) => {
    // Hacky but an easy way to handle legacy unprocessed drink scale images

    const baseImage = await sourceImageService.uploadSourceImage(
      {
        id: drinkwareSetId,
        file: baseImageFile,
        uploader: uploaderId,
      },
      'drink_scale',
    );

    const overlayImage = await sourceImageService.uploadSourceImage(
      {
        id: drinkwareSetId,
        file: overlayImageFile,
        uploader: uploaderId,
      },
      'drink_scale',
    );

    await translateSqlErrors(() =>
      kyselyDb.foods.transaction().execute(async (tx) => {
        if (update) {
          await tx
            .deleteFrom('drinkwareScales')
            .where('drinkwareSetId', '=', drinkwareSetId)
            .where('choiceId', '=', choiceId)
            .execute();
        }

        const { id } = await tx
          .insertInto('drinkwareScales')
          .values({
            label,
            choiceId,
            drinkwareSetId,
            width: Number.parseInt(width),
            height: Number.parseInt(height),
            emptyLevel: Number.parseInt(emptyLevel),
            fullLevel: Number.parseInt(fullLevel),
            baseImageUrl: baseImage.path,
            overlayImageUrl: overlayImage.path,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        const volumeSamplesRows = volumeSamples.map(sample => ({
          drinkwareScaleId: id,
          ...sample,
        }));

        await tx.insertInto('drinkwareVolumeSamples').values(volumeSamplesRows).execute();
      }),
    );
  };

  const getDrinkwareSet = async (
    drinkwareSetId: string,
  ): Promise<DrinkwareSetEntry | undefined> => {
    // Only return V1 scale if V2 scale does not exist for the same object
    function mergeScales(
      scalesV1: DrinkwareScaleEntry[],
      scalesV2: DrinkwareScaleV2Entry[],
    ): (DrinkwareScaleEntry | DrinkwareScaleV2Entry)[] {
      const merged: (DrinkwareScaleEntry | DrinkwareScaleV2Entry)[] = [...scalesV2];
      for (const scale of scalesV1) {
        if (merged.find(s => s.choiceId === scale.choiceId) === undefined)
          merged.push(scale);
      }
      return merged;
    }

    const sets = await kyselyDb.foods
      .selectFrom('drinkwareSets')
      .select(['id', 'description', 'imageMapId', 'label'])
      .where('drinkwareSets.id', '=', drinkwareSetId)
      .execute();

    const set = sets.at(0);
    if (!set)
      return undefined;

    const recordsV2 = await getDrinkScalesV2(drinkwareSetId);
    const recordsV1 = await getDrinkScalesV1(drinkwareSetId);

    return {
      id: set.id,
      description: set.description,
      imageMapId: set.imageMapId,
      label: parseLocaleTranslation(set.label),
      scales: mergeScales(recordsV1, recordsV2),
    };
  };

  const getDrinkwareSetOrThrow = async (drinkwareSetId: string): Promise<DrinkwareSetEntry> => {
    const set = await getDrinkwareSet(drinkwareSetId);

    if (set === undefined) {
      throw new Error(
        `Couldn't find drinkware set "${drinkwareSetId}" which was unexpected at this point`,
      );
    }

    return set;
  };

  const getDrinkwareSets = async (pagination: PaginateQuery): Promise<DrinkwareSetsResponse> => {
    const query = kyselyDb.foods
      .selectFrom('drinkwareSets')
      .leftJoin('imageMaps', 'imageMaps.id', 'drinkwareSets.imageMapId')
      .leftJoin('processedImages', 'processedImages.id', 'imageMaps.baseImageId')
      .select([
        'drinkwareSets.id',
        'drinkwareSets.description',
        'processedImages.path as imagePath',
      ]);

    const { data, meta } = await executeWithPagination(
      query,
      ['drinkwareSets.description', 'drinkwareSets.id'],
      ['drinkwareSets.description'],
      pagination,
    );

    return {
      meta,
      data: data.map((record) => {
        if (record.imagePath === null) {
          throw new Error(
            `Drinkware set ${record.id} is broken: either the image map id is invalid, or the base image is missing`,
          );
        }
        return {
          id: record.id,
          description: record.description,
          imageUrl: getImageUrl(record.imagePath),
        };
      }),
    };
  };

  const destroyDrinkScale = async (drinkwareSetId: string, choiceId: string) => {
    const deleteResultV1 = await kyselyDb.foods
      .deleteFrom('drinkwareScales')
      .where('drinkwareSetId', '=', drinkwareSetId)
      .where('choiceId', '=', choiceId)
      .executeTakeFirst();

    const deleteResultV2 = await kyselyDb.foods
      .deleteFrom('drinkwareScalesV2')
      .where('drinkwareSetId', '=', drinkwareSetId)
      .where('choiceId', '=', choiceId)
      .executeTakeFirst();

    return deleteResultV1.numDeletedRows + deleteResultV2.numDeletedRows;
  };

  const destroyAllDrinkScales = async (drinkwareSetId: string) => {
    const deleteResultV1 = await kyselyDb.foods
      .deleteFrom('drinkwareScales')
      .where('drinkwareSetId', '=', drinkwareSetId)
      .executeTakeFirst();

    const deleteResultV2 = await kyselyDb.foods
      .deleteFrom('drinkwareScalesV2')
      .where('drinkwareSetId', '=', drinkwareSetId)
      .executeTakeFirst();

    return deleteResultV1.numDeletedRows + deleteResultV2.numDeletedRows;
  };

  return {
    getDrinkScaleV1,
    getDrinkScalesV1,
    getDrinkScaleV2,
    getDrinkScalesV2,
    getDrinkScale,
    getDrinkScales,
    getDrinkwareSet,
    getDrinkwareSetOrThrow,
    getDrinkwareSets,
    createDrinkScaleV1,
    createDrinkScaleV2,
    getDrinkScaleV2ChoiceIds,
    updateDrinkScaleV2,
    destroyDrinkScale,
    destroyAllDrinkScales,
    create,
    update,
    destroy,
  };
}

export default drinkwareSetService;

export type DrinkwareSetService = ReturnType<typeof drinkwareSetService>;
