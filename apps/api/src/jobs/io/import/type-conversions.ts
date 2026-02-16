import type { AssociatedFoodAttributes, BulkCategoryInput, BulkFoodInput, LocaleRequest, NutrientTableRecordAttributes, PortionSizeMethodAttributes } from '@intake24/common/types/http/admin';
import type { PkgV2Locale } from '@intake24/common/types/package';
import type { PkgV2Category } from '@intake24/common/types/package/categories';
import type { PkgV2AssociatedFood, PkgV2Food, PkgV2PortionSizeMethod } from '@intake24/common/types/package/foods';

import { pkgV2PortionSizeMethodBase } from '@intake24/common/types/package/foods';

type WithParameters<
  T extends Record<string, any>,
  BaseKeys extends readonly (keyof T)[],
> = Pick<T, BaseKeys[number]> & {
  parameters: Omit<T, BaseKeys[number]>;
};

function groupParameters<
  T extends Record<string, unknown>,
  const K extends readonly (keyof T)[],
>(
  obj: T,
  baseKeys: K,
): WithParameters<T, K> {
  const base = new Set(baseKeys);
  const parameters: Record<string, unknown> = {};

  const result = {} as any;

  for (const key in obj) {
    if (base.has(key)) {
      result[key] = obj[key];
    }
    else {
      parameters[key] = obj[key];
    }
  }

  result.parameters = parameters;

  return result as WithParameters<T, K>;
}

type InputPortionSizeMethod = Omit<PortionSizeMethodAttributes, 'id'>;

function fromPackagePortionSizeMethod(psm: PkgV2PortionSizeMethod): InputPortionSizeMethod {
  const baseKeys = Object.keys(pkgV2PortionSizeMethodBase.shape) as (keyof PkgV2PortionSizeMethod)[];

  // Hacky, but InputPortionSizeMethod doesn't have proper types so we (hopefully) can get away with this
  return groupParameters(psm, baseKeys);
}

type InputAssociatedFood = Omit<AssociatedFoodAttributes, 'id' | 'foodId'>;

function fromPackageAssociatedFood(associatedFood: PkgV2AssociatedFood): InputAssociatedFood {
  return {
    orderBy: associatedFood.orderBy,
    multiple: !!associatedFood.multiple,
    linkAsMain: associatedFood.linkAsMain,
    genericName: associatedFood.genericName,
    associatedFoodCode: associatedFood.foodCode ?? null,
    associatedCategoryCode: associatedFood.categoryCode ?? null,
    text: associatedFood.promptText,
  };
}

type InputNutrientTableCode = Pick<NutrientTableRecordAttributes, 'nutrientTableId' | 'nutrientTableRecordId'>;

function fromPackageNutrientTableCodes(nutrientTableCodes: Record<string, string>): InputNutrientTableCode[] {
  return Object.entries(nutrientTableCodes).map(([nutrientTableId, nutrientTableRecordId]) => ({
    nutrientTableId,
    nutrientTableRecordId,
  }));
}

export function fromPackageFood(food: PkgV2Food): BulkFoodInput {
  return {
    code: food.code,
    version: food.version,
    name: food.name,
    englishName: food.englishName,
    altNames: food.alternativeNames,
    tags: food.tags,
    attributes: food.attributes,
    parentCategories: food.parentCategories,
    nutrientRecords: fromPackageNutrientTableCodes(food.nutrientTableCodes),
    portionSizeMethods: food.portionSize.map(fromPackagePortionSizeMethod),
    associatedFoods: food.associatedFoods.map(fromPackageAssociatedFood),
  };

  // FIXME: brandNames, thumbnailPath are missing from BulkFoodInput but present in PkgV2Food
  //        need to be handled somehow
}

export function fromPackageCategory(category: PkgV2Category): BulkCategoryInput {
  return {
    code: category.code,
    englishName: category.englishName,
    name: category.name,
    hidden: category.hidden,
    tags: category.tags,
    version: category.version,
    attributes: category.attributes,
    parentCategories: category.parentCategories,
    portionSizeMethods: category.portionSize.map(fromPackagePortionSizeMethod),
  };
}

export function fromPackageLocale(locale: PkgV2Locale): LocaleRequest {
  return {
    code: locale.id,
    localName: locale.localName,
    englishName: locale.englishName,
    countryFlagCode: locale.flagCode,
    respondentLanguageId: locale.respondentLanguage,
    adminLanguageId: locale.adminLanguage,
    textDirection: locale.textDirection,
    foodIndexLanguageBackendId: locale.foodIndexLanguageBackendId,
  };
}
