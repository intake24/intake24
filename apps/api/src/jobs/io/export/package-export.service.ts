import { IoC } from '@intake24/api/ioc';
import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PkgFood } from '@intake24/common/types/package/foods';

export type LocaleStreams = {
  foods?: AsyncGenerator<PkgFood>;
};

export type PackageDataStreams = {
  [k: string]: LocaleStreams;
};

export function createPackageExportService({
  packageWriters,
  kyselyDb,
}: Pick<IoC, 'kyselyDb' | 'packageWriters'>) {
  async function* streamFoods(localeId: string, batchSize = 100) {
    const dbStream = kyselyDb.foods
      .selectFrom('foods')
      .select(['foods.code', 'foods.name', 'foods.altNames', 'foods.englishName', 'foods.tags'])
      .where('foods.localeId', '=', localeId)
      .orderBy('foods.id', 'asc')
      .stream(batchSize);

    return (async function* (): AsyncGenerator<PkgFood> {
      for await (const row of dbStream) {
        yield {
          code: row.code,
          name: row.name ?? row.englishName,
          englishName: row.englishName,
          alternativeNames: JSON.parse(row.altNames),
          tags: JSON.parse(row.tags),
          attributes: {

          },
          parentCategories: [],
          nutrientTableCodes: {},
          portionSize: [],
          associatedFoods: [],
          brandNames: [],
          // thumbnailPath?: string;
        };
      }
    })();
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
