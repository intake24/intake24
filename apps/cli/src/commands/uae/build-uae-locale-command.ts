import fs from 'node:fs/promises';
import path from 'node:path';

import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import { PkgConstants } from '../packager/constants';
import { PackageWriter } from '../packager/package-writer';
import { PkgGlobalFood, PkgLocalFood } from '../packager/types/foods';
import { PkgLocale } from '../packager/types/locale';

export interface UAELocaleOptions {
  sourceLocaleCode: string;
  sourcePath: string;
  prototypeLocaleCode: string;
  prototypePath: string;
  fallbackLocaleCode: string;
  fallbackPath: string;
  fallback2LocaleCode: string;
  fallback2Path: string;
  fallback3LocaleCode: string;
  fallback3Path: string;
  outputPath: string;
}

const locale: PkgLocale = {
  id: 'ar_AE_NYUAD',
  localName: 'الإمارات العربية المتحدة (جامعة نيويورك أبوظبي)',
  englishName: 'UAE (NYU Abu Dhabi)',
  textDirection: 'rtl',
  prototypeLocale: null,
  respondentLanguage: 'ar-AE',
  flagCode: 'ae',
  adminLanguage: 'en',
  foodIndexLanguageBackendId: 'en',
};

async function readJSON<T>(logger: typeof mainLogger, filePath: string): Promise<T> {
  logger.debug(`Reading JSON file: ${filePath}`);
  return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
}

function codeTransform(sourceCode: string): string {
  return `AE_${sourceCode}`
    .replace('AE_AE_', 'AE_')
    .replace('DK_', 'D')
    .replace('KW_', 'K')
    .replace('PT_', 'P')
    .replace('SA_', 'S')
    .replace('QA_', 'Q')
    .substring(0, 8);
}

export default async (options: UAELocaleOptions): Promise<void> => {
  const logger = mainLogger.child({ service: 'UAE locale build' });

  logger.info('Loading source foods');
  const sourceGlobalFoods = await readJSON<PkgGlobalFood[]>(logger, path.join(options.sourcePath, PkgConstants.GLOBAL_FOODS_FILE_NAME));
  const sourceLocalFoods = (await readJSON<Record<string, PkgLocalFood[]>>(logger, path.join(options.sourcePath, PkgConstants.LOCAL_FOODS_FILE_NAME)))[options.sourceLocaleCode];

  logger.info('Loading prototype foods');
  const prototypeGlobalFoods = await readJSON<PkgGlobalFood[]>(logger, path.join(options.prototypePath, PkgConstants.GLOBAL_FOODS_FILE_NAME));
  const prototypeLocalFoods = (await readJSON<Record<string, PkgLocalFood[]>>(logger, path.join(options.prototypePath, PkgConstants.LOCAL_FOODS_FILE_NAME)))[options.prototypeLocaleCode];

  logger.info('Loading fallback foods');
  const fallbackGlobalFoods = await readJSON<PkgGlobalFood[]>(logger, path.join(options.fallbackPath, PkgConstants.GLOBAL_FOODS_FILE_NAME));
  const fallbackLocalFoods = (await readJSON<Record<string, PkgLocalFood[]>>(logger, path.join(options.fallbackPath, PkgConstants.LOCAL_FOODS_FILE_NAME)))[options.fallbackLocaleCode];

  logger.info('Loading fallback 2 foods');
  const fallback2GlobalFoods = await readJSON<PkgGlobalFood[]>(logger, path.join(options.fallback2Path, PkgConstants.GLOBAL_FOODS_FILE_NAME));
  const fallback2LocalFoods = (await readJSON<Record<string, PkgLocalFood[]>>(logger, path.join(options.fallback2Path, PkgConstants.LOCAL_FOODS_FILE_NAME)))[options.fallback2LocaleCode];

  logger.info('Loading fallback 3 foods');
  const fallback3GlobalFoods = await readJSON<PkgGlobalFood[]>(logger, path.join(options.fallback3Path, PkgConstants.GLOBAL_FOODS_FILE_NAME));
  const fallback3LocalFoods = (await readJSON<Record<string, PkgLocalFood[]>>(logger, path.join(options.fallback3Path, PkgConstants.LOCAL_FOODS_FILE_NAME)))[options.fallback3LocaleCode];

  logger.info('Building global foods');

  const globalFoods = sourceGlobalFoods.map(
    (sourceFood) => {
      let globalFoodData = sourceFood;

      const prototypeFoodData = prototypeGlobalFoods.find(food => food.code === sourceFood.code);
      const fallbackFoodData = fallbackGlobalFoods.find(food => food.code === sourceFood.code);
      const fallback2FoodData = fallback2GlobalFoods.find(food => food.code === sourceFood.code);
      const fallback3FoodData = fallback3GlobalFoods.find(food => food.code === sourceFood.code);

      if (prototypeFoodData !== undefined) {
        globalFoodData = prototypeFoodData;
        logger.debug(`Using prototype locale ${options.prototypeLocaleCode} for food code ${sourceFood.code} (global)`);
      }
      else if (fallbackFoodData !== undefined) {
        globalFoodData = fallbackFoodData;
        logger.debug(`Using fallback locale ${options.fallbackLocaleCode} for food code ${sourceFood.code} (global)`);
      }
      else if (fallback2FoodData !== undefined) {
        globalFoodData = fallback2FoodData;
        logger.debug(`Using fallback 2 locale ${options.fallback2LocaleCode} for food code ${sourceFood.code} (global)`);
      }
      else if (fallback3FoodData !== undefined) {
        globalFoodData = fallback3FoodData;
        logger.debug(`Using fallback 3 locale ${options.fallback3LocaleCode} for food code ${sourceFood.code} (global)`);
      }
      else {
        logger.debug(`Using source locale ${options.sourceLocaleCode} for food code ${sourceFood.code} (global)`);
      }

      return {
        version: sourceFood.version,
        code: codeTransform(sourceFood.code),
        englishDescription: globalFoodData.englishDescription,
        attributes: globalFoodData.attributes,
        parentCategories: globalFoodData.parentCategories,
      };
    },
  );

  const localFoods = sourceLocalFoods.map(
    (sourceFood) => {
      let localFoodData = sourceFood;

      const prototypeFoodData = prototypeLocalFoods.find(food => food.code === sourceFood.code);
      const fallbackFoodData = fallbackLocalFoods.find(food => food.code === sourceFood.code);
      const fallback2FoodData = fallback2LocalFoods.find(food => food.code === sourceFood.code);
      const fallback3FoodData = fallback3LocalFoods.find(food => food.code === sourceFood.code);

      if (prototypeFoodData !== undefined) {
        localFoodData = prototypeFoodData;
        logger.debug(`Using prototype locale ${options.prototypeLocaleCode} for food code ${sourceFood.code} (local)`);
      }
      else if (fallbackFoodData !== undefined) {
        localFoodData = fallbackFoodData;
        logger.debug(`Using fallback locale ${options.fallbackLocaleCode} for food code ${sourceFood.code} (local)`);
      }
      else if (fallback2FoodData !== undefined) {
        localFoodData = fallback2FoodData;
        logger.debug(`Using fallback 2 locale ${options.fallback2LocaleCode} for food code ${sourceFood.code} (local)`);
      }
      else if (fallback3FoodData !== undefined) {
        localFoodData = fallback3FoodData;
        logger.debug(`Using fallback 3 locale ${options.fallback3LocaleCode} for food code ${sourceFood.code} (local)`);
      }
      else {
        logger.debug(`Using source locale ${options.sourceLocaleCode} for food code ${sourceFood.code} (local)`);
      }

      return {
        code: codeTransform(sourceFood.code),
        version: localFoodData.version,
        localDescription: sourceFood.localDescription,
        alternativeNames: {},
        nutrientTableCodes: localFoodData.nutrientTableCodes,
        portionSize: localFoodData.portionSize,
        associatedFoods: localFoodData.associatedFoods,
        brandNames: localFoodData.brandNames,
      };
    },
  );

  const writer = new PackageWriter(logger, options.outputPath);

  await Promise.all([
    writer.writeLocales([locale]),
    writer.writeLocalFoods(
      {
        [locale.id]: localFoods,
      },
    ),
    writer.writeGlobalFoods(
      globalFoods,
    ),
    writer.writeEnabledLocalFoods(
      {
        [locale.id]: globalFoods.map(f => f.code),
      },
    ),
    writer.writePackageInfo(),
  ]);
};
