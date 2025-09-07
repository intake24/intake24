import type {
  PkgGlobalCategory,
  PkgLocalCategory,
} from '@intake24/cli/commands/packager/types/categories';
import type {
  PkgAsServedPsm,
  PkgAssociatedFood,
  PkgCerealPsm,
  PkgDrinkScalePsm,
  PkgGlobalFood,
  PkgGuideImagePsm,
  PkgInheritableAttributes,
  PkgLocalFood,
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
  CreateGlobalCategoryRequest,
  CreateGlobalFoodRequest,
  CreateLocalCategoryRequest,
  CreateLocalFoodRequest,
  FoodEntry,
  FoodLocalEntry,
  GuideImageInputObject,
  ImageMapEntryObject,
  LocaleEntry,
  LocaleRequest,
  NutrientTableRecordRequest,
  NutrientTableRequest,
} from '@intake24/common/types/http/admin';
import type { AssociatedFood } from '@intake24/common/types/http/admin/associated-food';
import { AssociatedFoodAttributes, FoodPortionSizeMethodAttributes } from '@intake24/db';

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
    prototypeLocaleId: locale.prototypeLocale,
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

function fromPackageGlobalFood(globalFood: PkgGlobalFood): CreateGlobalFoodRequest {
  return {
    code: globalFood.code,
    name: globalFood.englishDescription,
    parentCategories: globalFood.parentCategories,
    attributes: {
      readyMealOption: globalFood.attributes.readyMealOption,
      reasonableAmount: globalFood.attributes.reasonableAmount,
      sameAsBeforeOption: globalFood.attributes.sameAsBeforeOption,
      useInRecipes: validateUseInRecipes(globalFood.attributes.useInRecipes),
    },
    foodGroupId: 0,
  };
}

function fromPackageGlobalCategory(globalCategory: PkgGlobalCategory): CreateGlobalCategoryRequest {
  return {
    code: globalCategory.code,
    name: globalCategory.englishDescription,
    parentCategories: globalCategory.parentCategories,
    isHidden: globalCategory.isHidden,
    attributes: {
      readyMealOption: globalCategory.attributes.readyMealOption,
      reasonableAmount: globalCategory.attributes.reasonableAmount,
      sameAsBeforeOption: globalCategory.attributes.sameAsBeforeOption,
      useInRecipes: validateUseInRecipes(globalCategory.attributes.useInRecipes),
    },
  };
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

function fromPackageLocalFood(localFood: PkgLocalFood): CreateLocalFoodRequest {
  return {
    code: localFood.code,
    name: localFood.localDescription ?? 'Missing local description!',
    altNames: localFood.alternativeNames,
    tags: localFood.tags,
    associatedFoods: localFood.associatedFoods.map(af => fromPackageAssociatedFood(af)),
    portionSizeMethods: localFood.portionSize.map((psm, idx) => fromPackagePortionSizeMethod(psm, idx.toString())),
    nutrientTableCodes: localFood.nutrientTableCodes,
  };
}

function fromPackageLocalCategory(localCategory: PkgLocalCategory): CreateLocalCategoryRequest {
  return {
    code: localCategory.code,
    version: localCategory.version,
    name: localCategory.localDescription ?? 'Missing description!',
    portionSizeMethods: localCategory.portionSize.map((psm, idx) => fromPackagePortionSizeMethod(psm, idx.toString())),
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

function packageLocalFood(code: string, language: string, localFood: FoodLocalEntry): PkgLocalFood {
  const nutrientTableCodes: Record<string, string> = {};

  if (localFood.nutrientRecords !== undefined) {
    for (const record of localFood.nutrientRecords) {
      nutrientTableCodes[record.nutrientTableId] = record.nutrientTableRecordId;
    }
  }

  return {
    code,
    version: undefined,
    localDescription:
        localFood.name,
    alternativeNames: localFood.altNames,
    associatedFoods: localFood.associatedFoods?.map(af => packageAssociatedFoodPrompt(language, af)) || [],
    brandNames: [],
    nutrientTableCodes,
    portionSize: localFood.portionSizeMethods?.map(packagePortionSize) || [],
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

function packageGlobalFood(food: FoodEntry): PkgGlobalFood {
  const parentCategories = food.parentCategories ? food.parentCategories.map(category => category.code) : [];

  const attributes: PkgInheritableAttributes = {
    readyMealOption: food.attributes?.readyMealOption ?? undefined,
    sameAsBeforeOption: food.attributes?.sameAsBeforeOption ?? undefined,
    reasonableAmount: food.attributes?.reasonableAmount ?? undefined,
    useInRecipes: food.attributes?.useInRecipes ?? undefined,
  };

  return {
    version: food.version,
    code: food.code,
    englishDescription: food.name,
    attributes,
    parentCategories,
  };
}

function packageLocale(locale: LocaleEntry): PkgLocale {
  return {
    id: locale.id,
    englishName: locale.englishName,
    localName: locale.localName,
    prototypeLocale: locale.prototypeLocaleId,
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
  fromPackageGlobalFood,
  fromPackageLocalFood,
  fromPackageGlobalCategory,
  fromPackageLocalCategory,
  fromPackageNutrientTable,
  fromPackageNutrientTableRecords,
  packageLocale,
  packageLocalFood,
  packageGlobalFood,
};
