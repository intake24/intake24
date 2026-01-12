import type {
  PkgCategory,
} from '@intake24/cli/commands/packager/types/categories';
import type {
  PkgAsServedPsm,
  PkgAssociatedFood,
  PkgCerealPsm,
  PkgDrinkScalePsm,
  PkgFood,
  PkgGuideImagePsm,
  PkgInheritableAttributes,
  PkgMilkInHotDrinkPsm,
  PkgMilkOnCerealPsm,
  PkgPizzaPsm,
  PkgPortionSizeMethod,
  PkgStandardPortionPsm,
} from '@intake24/cli/commands/packager/types/foods';
import type { PkgImageMapObject } from '@intake24/cli/commands/packager/types/image-map';
import type { PkgLocale } from '@intake24/cli/commands/packager/types/locale';
import type { PkgNutrientTable } from '@intake24/cli/commands/packager/types/nutrient-tables';
import type { AsServedPsm, CerealPsm, DrinkScalePsm, GuideImagePsm, MilkInHotDrinkPsm, MilkOnCerealPsm, PizzaPsm, PortionSizeMethod, StandardPortionPsm } from '@intake24/common/surveys';
import type { UseInRecipeType } from '@intake24/common/types';
import { useInRecipeTypes } from '@intake24/common/types';
import type {
  CreateCategoryRequest,
  CreateFoodRequest,
  FoodEntry,
  GuideImageInputObject,
  ImageMapEntryObject,
  LocaleEntry,
  LocaleRequest,
  NutrientTableRecordRequest,
  NutrientTableRequest,
} from '@intake24/common/types/http/admin';
import type { AssociatedFood } from '@intake24/common/types/http/admin/associated-food';
import type { AssociatedFoodAttributes, FoodPortionSizeMethodAttributes } from '@intake24/db';

function fromPackageImageMapObjects(
  objects: Record<string, PkgImageMapObject>,
): ImageMapEntryObject[] {
  return Object.entries(objects).map(([objId, obj]) => ({
    id: objId,
    description: obj.description,
    navigationIndex: obj.navigationIndex,
    outlineCoordinates: obj.outlineCoordinates,
    label: { en: obj.description },
  }));
}

function fromPackageGuideImageObjects(
  objects: Record<number, number>,
): GuideImageInputObject[] {
  return Object.entries(objects).map(([objId, weight]) => ({
    id: objId,
    label: { en: 'No description ' },
    weight,
  }));
}

function fromPackageLocale(locale: PkgLocale): LocaleRequest {
  return {
    code: locale.id,
    localName: locale.localName,
    englishName: locale.englishName,
    adminLanguageId: locale.adminLanguage,
    countryFlagCode: locale.flagCode,
    foodIndexLanguageBackendId: locale.foodIndexLanguageBackendId ?? 'en',
    respondentLanguageId: locale.respondentLanguage,
    textDirection: locale.textDirection,
  };
}

function validateUseInRecipes(useInRecipes: number | undefined): UseInRecipeType | undefined {
  if (useInRecipes === undefined)
    return undefined;
  const value = Object.entries(useInRecipeTypes).find(type => type[1] === useInRecipes);
  if (value === undefined)
    throw new Error(`Invalid useInRecipes value: ${useInRecipes}`);
  return value[1];
}

function fromPackageAssociatedFood(associatedFood: PkgAssociatedFood): AssociatedFood {
  return {
    foodCode: associatedFood.foodCode,
    categoryCode: associatedFood.categoryCode,
    genericName: associatedFood.genericName,
    linkAsMain: associatedFood.linkAsMain,
    promptText: associatedFood.promptText,
    allowMultiple: false,
  };
}

// V4 types are very similar to pkg types at the moment but better to explicitly map
// them to preserve type safety in case they diverge
function fromPackagePortionSizeMethod(psm: PkgPortionSizeMethod, orderBy: string): PortionSizeMethod {
  const baseFields = {
    description: psm.description,
    conversionFactor: psm.conversionFactor,
    useForRecipes: psm.useForRecipes,
    orderBy,
  };

  switch (psm.method) {
    case 'as-served':
      return {
        ...baseFields,
        method: 'as-served',
        parameters: {
          servingImageSet: psm.servingImageSet,
          leftoversImageSet: psm.leftoversImageSet,
          multiple: psm.multiple,
        },
      };
    case 'guide-image':
      return {
        ...baseFields,
        method: 'guide-image',
        parameters: {
          guideImageId: psm.guideImageId,
        },
      };
    case 'drink-scale':
      return {
        ...baseFields,
        method: 'drink-scale',
        parameters: {
          drinkwareId: psm.drinkwareId,
          skipFillLevel: psm.skipFillLevel,
          initialFillLevel: psm.initialFillLevel,
          multiple: psm.multiple,
        },
      };
    case 'standard-portion':
      return {
        ...baseFields,
        method: 'standard-portion',
        parameters: {
          units: psm.units.map(pkgUnit => ({
            name: pkgUnit.name,
            weight: pkgUnit.weight,
            omitFoodDescription: pkgUnit.omitFoodDescription,
            inlineEstimateIn: pkgUnit.inlineEstimateIn,
            inlineHowMany: pkgUnit.inlineHowMany,
          })),
        },
      };
    case 'cereal':
      return {
        ...baseFields,
        method: 'cereal',
        parameters: {
          type: psm.type as 'hoop' | 'flake' | 'rkris',
        },
      };
    case 'milk-in-a-hot-drink':
      return {
        ...baseFields,
        method: 'milk-in-a-hot-drink',
        parameters: {
          options: { en: [] },
        },
      };
    case 'milk-on-cereal':
      return {
        ...baseFields,
        method: 'milk-on-cereal',
        parameters: {},
      };
    case 'pizza':
      return {
        ...baseFields,
        method: 'pizza',
        parameters: {},
      };
    case 'direct-weight':
      return {
        ...baseFields,
        method: 'direct-weight',
        parameters: {},
      };
    case 'unknown':
      return {
        ...baseFields,
        method: 'unknown',
        parameters: {},
      };
  }
}

function fromPackageFood(food: PkgFood): CreateFoodRequest {
  return {
    code: food.code,
    name: food.name ?? 'Missing local description!',
    englishName: food.englishName ?? 'Missing local description!',
    altNames: food.alternativeNames,
    tags: food.tags,
    parentCategories: food.parentCategories,
    attributes: {
      readyMealOption: food.attributes.readyMealOption,
      reasonableAmount: food.attributes.reasonableAmount,
      sameAsBeforeOption: food.attributes.sameAsBeforeOption,
      useInRecipes: validateUseInRecipes(food.attributes.useInRecipes),
    },
    associatedFoods: food.associatedFoods.map(af => fromPackageAssociatedFood(af)),
    portionSizeMethods: food.portionSize.map((psm, idx) => fromPackagePortionSizeMethod(psm, idx.toString())),
    nutrientTableCodes: food.nutrientTableCodes,
  };
}

function fromPackageCategory(category: PkgCategory): CreateCategoryRequest {
  return {
    code: category.code,
    version: category.version,
    name: category.name,
    englishName: category.englishName,
    parentCategories: category.parentCategories,
    hidden: category.hidden,
    attributes: {
      readyMealOption: category.attributes.readyMealOption,
      reasonableAmount: category.attributes.reasonableAmount,
      sameAsBeforeOption: category.attributes.sameAsBeforeOption,
      useInRecipes: validateUseInRecipes(category.attributes.useInRecipes),
    },
    portionSizeMethods: category.portionSize.map((psm, idx) => fromPackagePortionSizeMethod(psm, idx.toString())),
  };
}

function fromPackageNutrientTable(nutrientTable: PkgNutrientTable): NutrientTableRequest {
  return {
    id: nutrientTable.id,
    description: nutrientTable.description,
    csvMapping: {
      rowOffset: nutrientTable.csvMapping.rowOffset,
      idColumnOffset: nutrientTable.csvMapping.idColumnOffset,
      descriptionColumnOffset: nutrientTable.csvMapping.descriptionColumnOffset,
      localDescriptionColumnOffset: nutrientTable.csvMapping.localDescriptionColumnOffset ?? null,
    },
    csvMappingFields: nutrientTable.csvFieldMapping,
    csvMappingNutrients: nutrientTable.csvNutrientMapping,
  };
}

function fromPackageNutrientTableRecords(nutrientTable: PkgNutrientTable): NutrientTableRecordRequest[] {
  return nutrientTable.records;
}

function packageAssociatedFoodPrompt(language: string, assocFood: AssociatedFoodAttributes): PkgAssociatedFood {
  const genericNameFiltered: Record<string, string> = {};

  for (const [k, v] of Object.entries(assocFood.genericName)) {
    if (v !== null)
      genericNameFiltered[k] = v;
  }

  const promptTextFiltered: Record<string, string> = {};

  for (const [k, v] of Object.entries(assocFood.text)) {
    if (v !== null)
      promptTextFiltered[k] = v;
  }

  return {
    foodCode: assocFood.associatedFoodCode ?? undefined,
    categoryCode: assocFood.associatedCategoryCode ?? undefined,
    genericName: genericNameFiltered,
    promptText: promptTextFiltered,
    linkAsMain: assocFood.linkAsMain,
  };
}

function packageFood(code: string, language: string, food: FoodEntry): PkgFood {
  const parentCategories = food.parentCategories ? food.parentCategories.map(category => category.code) : [];

  const attributes: PkgInheritableAttributes = {
    readyMealOption: food.attributes?.readyMealOption ?? undefined,
    sameAsBeforeOption: food.attributes?.sameAsBeforeOption ?? undefined,
    reasonableAmount: food.attributes?.reasonableAmount ?? undefined,
    useInRecipes: food.attributes?.useInRecipes ?? undefined,
  };

  const nutrientTableCodes: Record<string, string> = {};

  if (food.nutrientRecords !== undefined) {
    for (const record of food.nutrientRecords) {
      nutrientTableCodes[record.nutrientTableId] = record.nutrientTableRecordId;
    }
  }

  return {
    code,
    version: undefined,
    name: food.name ?? food.englishName,
    englishName: food.englishName,
    alternativeNames: food.altNames,
    associatedFoods: food.associatedFoods?.map(af => packageAssociatedFoodPrompt(language, af)) || [],
    attributes,
    brandNames: [],
    nutrientTableCodes,
    parentCategories,
    portionSize: food.portionSizeMethods?.map(packagePortionSize) || [],
  };
}

// function packageLocale(locale: )

function packageAsServed(portionSize: AsServedPsm): PkgAsServedPsm {
  return {
    method: 'as-served',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    servingImageSet: portionSize.parameters.servingImageSet,
    leftoversImageSet: portionSize.parameters.leftoversImageSet ?? undefined,
  };
}

function packageGuideImage(portionSize: GuideImagePsm): PkgGuideImagePsm {
  return {
    method: 'guide-image',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    guideImageId: portionSize.parameters.guideImageId,
  };
}

function packageDrinkScale(portionSize: DrinkScalePsm): PkgDrinkScalePsm {
  return {
    method: 'drink-scale',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    drinkwareId: portionSize.parameters.drinkwareId,
    initialFillLevel: portionSize.parameters.initialFillLevel,
    skipFillLevel: portionSize.parameters.skipFillLevel,
  };
}

function packageStandardPortion(portionSize: StandardPortionPsm): PkgStandardPortionPsm {
  return {
    method: 'standard-portion',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    units: portionSize.parameters.units,
  };
}

function packageCereal(portionSize: CerealPsm): PkgCerealPsm {
  return {
    method: 'cereal',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    type: portionSize.parameters.type,
  };
}

function packageMilkOnCereal(portionSize: MilkOnCerealPsm): PkgMilkOnCerealPsm {
  return {
    method: 'milk-on-cereal',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
  };
}

function packagePizza(portionSize: PizzaPsm): PkgPizzaPsm {
  return {
    method: 'pizza',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
  };
}

function packageMilkInHotDrink(portionSize: MilkInHotDrinkPsm): PkgMilkInHotDrinkPsm {
  return {
    method: 'milk-in-a-hot-drink',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
  };
}

function packagePortionSize(portionSize: FoodPortionSizeMethodAttributes): PkgPortionSizeMethod {
  switch (portionSize.method) {
    case 'as-served':
      return packageAsServed(portionSize as AsServedPsm);
    case 'guide-image':
      return packageGuideImage(portionSize as GuideImagePsm);
    case 'drink-scale':
      return packageDrinkScale(portionSize as DrinkScalePsm);
    case 'standard-portion':
      return packageStandardPortion(portionSize as StandardPortionPsm);
    case 'cereal':
      return packageCereal(portionSize as CerealPsm);
    case 'milk-on-cereal':
      return packageMilkOnCereal(portionSize as MilkOnCerealPsm);
    case 'pizza':
      return packagePizza(portionSize as PizzaPsm);
    case 'milk-in-a-hot-drink':
      return packageMilkInHotDrink(portionSize as MilkInHotDrinkPsm);
    default:
      throw new Error(`Unexpected portion size estimation method: ${portionSize.method}`);
  }
}

function packageLocale(locale: LocaleEntry): PkgLocale {
  return {
    id: locale.id,
    englishName: locale.englishName,
    localName: locale.localName,
    adminLanguage: locale.adminLanguage?.code || locale.adminLanguageId,
    respondentLanguage: locale.respondentLanguage?.code || locale.respondentLanguageId,
    textDirection: locale.textDirection,
    flagCode: locale.countryFlagCode,
  };
}

export default {
  fromPackageImageMapObjects,
  fromPackageGuideImageObjects,
  fromPackageLocale,
  fromPackageFood,
  fromPackageCategory,
  fromPackageNutrientTable,
  fromPackageNutrientTableRecords,
  packageLocale,
  packageFood,
};
