import { IoC } from '@intake24/api/ioc';
import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PkgV2Food, PkgV2PortionSizeMethod } from '@intake24/common/types/package/foods';
import { packagePortionSize } from './type-conversions';

export type LocaleStreams = {
  foods?: AsyncIterable<PkgV2Food>;
};

export type PackageDataStreams = {
  [k: string]: LocaleStreams;
};

export function createPackageExportService({
  packageWriters,
  kyselyDb,
}: Pick<IoC, 'kyselyDb' | 'packageWriters'>) {
  async function* batchStream<T>(stream: AsyncIterable<T>, batchSize: number): AsyncIterable<T[]> {
    let batch: T[] = [];
    for await (const row of stream) {
      batch.push(row);
      if (batch.length >= batchSize) {
        yield batch;
        batch = [];
      }
    }
    if (batch.length > 0)
      yield batch;
  };

  async function* streamFoods(localeId: string, batchSize = 100): AsyncIterable<PkgV2Food> {
    const dbStream = kyselyDb.foods
      .selectFrom('foods')
      .leftJoin('foodAttributes', 'foodAttributes.foodId', 'foods.id')
      .select(['foods.id', 'foods.code', 'foods.name', 'foods.altNames', 'foods.englishName', 'foods.tags', 'foodAttributes.readyMealOption', 'foodAttributes.reasonableAmount', 'foodAttributes.sameAsBeforeOption', 'foodAttributes.useInRecipes'])
      .where('foods.localeId', '=', localeId)
      .orderBy('foods.id', 'asc')
      .stream(batchSize);

    const batchedStream = batchStream(dbStream, batchSize);

    for await (const batch of batchedStream) {
      const foodIds = batch.map(row => row.id);

      const parentCategories = await kyselyDb.foods
        .selectFrom('foodsCategories')
        .innerJoin('categories', 'categories.id', 'foodsCategories.categoryId')
        .select(['foodId', 'categories.code'])
        .where('foodsCategories.foodId', 'in', foodIds)
        .execute();

      const parentCategoryIndex = parentCategories.reduce<Record<string, string[]>>((acc, { foodId, code }) => {
        if (!acc[foodId])
          acc[foodId] = [];
        acc[foodId].push(code);
        return acc;
      }, {});

      const nutrientTableCodes = await kyselyDb.foods
        .selectFrom('foodsNutrients')
        .innerJoin('nutrientTableRecords', 'foodsNutrients.nutrientTableRecordId', 'nutrientTableRecords.id')
        .select(['foodsNutrients.foodId', 'nutrientTableRecords.nutrientTableId', 'nutrientTableRecords.nutrientTableRecordId'])
        .where('foodsNutrients.foodId', 'in', foodIds)
        .execute();

      const nutrientTableCodeIndex = nutrientTableCodes.reduce<Record<string, Record<string, string>>>((acc, { foodId, nutrientTableId, nutrientTableRecordId }) => {
        if (!acc[foodId])
          acc[foodId] = {};
        acc[foodId][nutrientTableId] = nutrientTableRecordId;
        return acc;
      }, {});

      const portionSizeMethods = await kyselyDb.foods
        .selectFrom('foodPortionSizeMethods')
        .select(['foodPortionSizeMethods.id', 'foodPortionSizeMethods.foodId', 'foodPortionSizeMethods.method', 'foodPortionSizeMethods.description', 'foodPortionSizeMethods.parameters', 'foodPortionSizeMethods.conversionFactor', 'foodPortionSizeMethods.useForRecipes'])
        .where('foodPortionSizeMethods.foodId', 'in', foodIds)
        .orderBy('foodPortionSizeMethods.orderBy', 'asc')
        .execute();

      const foodPortionSizeMethodsIndex = portionSizeMethods.reduce<Record<string, PkgV2PortionSizeMethod[]>>((acc, row) => {
        if (!acc[row.foodId])
          acc[row.foodId] = [];
        acc[row.foodId].push(packagePortionSize(row));
        return acc;
      }, {});

      for (const row of batch) {
        yield {
          code: row.code,
          name: row.name ?? row.englishName,
          englishName: row.englishName,
          alternativeNames: JSON.parse(row.altNames),
          tags: JSON.parse(row.tags),
          attributes: {
            readyMealOption: row.readyMealOption ?? undefined,
            reasonableAmount: row.reasonableAmount ?? undefined,
            sameAsBeforeOption: row.sameAsBeforeOption ?? undefined,
            useInRecipes: row.useInRecipes ?? undefined,
          },
          parentCategories: parentCategoryIndex[row.id] ?? [],
          nutrientTableCodes: nutrientTableCodeIndex[row.id] ?? {},
          portionSize: foodPortionSizeMethodsIndex[row.id] ?? [],
          associatedFoods: [],
          brandNames: [],
        // thumbnailPath?: string;
        };
      }
    }
  }

  function getLocaleStreams(localeId: string): LocaleStreams {
    return {
      foods: streamFoods(localeId),
    };
  }

  return async (options: PackageExportOptions): Promise<void> => {
    const writePackage = packageWriters[options.format];

    const packageStreams = Object.fromEntries(options.locales.map(localeId => [localeId, getLocaleStreams(localeId)]));

    await writePackage('', options, packageStreams);
  };
}

export type PackageExportService = ReturnType<typeof createPackageExportService>;
