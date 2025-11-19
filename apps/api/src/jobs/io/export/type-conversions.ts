import { Selectable } from 'kysely';
import { ZodError } from 'zod';
import { asServedPortionSizeParameters, cerealPortionSizeParameters, drinkScalePortionSizeParameters, guideImagePortionSizeParameters, milkInHotDrinkPortionSizeParameters, milkOnCerealPortionSizeParameters, parentFoodPortionParameters, pizzaPortionSizeParameters, pizzaV2PortionSizeParameters, standardPortionSizeParameters } from '@intake24/common/surveys/portion-size';
import { PkgV2AsServedPsm, PkgV2CerealPsm, PkgV2DirectWeightPsm, PkgV2DrinkScalePsm, PkgV2GuideImagePsm, PkgV2MilkInHotDrinkPsm, PkgV2MilkOnCerealPsm, PkgV2ParentFoodPortionPsm, PkgV2PizzaPsm, PkgV2PizzaV2Psm, PkgV2PortionSizeMethod, PkgV2StandardPortionPsm, PkgV2UnknownPsm } from '@intake24/common/types/package/foods';
import type { FoodPortionSizeMethods } from '@intake24/db/kysely/foods';

type FoodPortionSizeMethodsRow = Pick<Selectable<FoodPortionSizeMethods>, 'id' | 'method' | 'description' | 'conversionFactor' | 'useForRecipes' | 'parameters'>;

function packageAsServed(portionSize: FoodPortionSizeMethodsRow): PkgV2AsServedPsm {
  const parameters = asServedPortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'as-served',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    servingImageSet: parameters.servingImageSet,
    leftoversImageSet: parameters.leftoversImageSet ?? undefined,
    multiple: parameters.multiple,
  };
}

function packageGuideImage(portionSize: FoodPortionSizeMethodsRow): PkgV2GuideImagePsm {
  const parameters = guideImagePortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'guide-image',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    guideImageId: parameters.guideImageId,
  };
}

function packageDrinkScale(portionSize: FoodPortionSizeMethodsRow): PkgV2DrinkScalePsm {
  const parameters = drinkScalePortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'drink-scale',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    drinkwareId: parameters.drinkwareId,
    initialFillLevel: parameters.initialFillLevel,
    skipFillLevel: parameters.skipFillLevel,
  };
}

function packageStandardPortion(portionSize: FoodPortionSizeMethodsRow): PkgV2StandardPortionPsm {
  const parameters = standardPortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'standard-portion',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    units: parameters.units,
  };
}

function packageCereal(portionSize: FoodPortionSizeMethodsRow): PkgV2CerealPsm {
  const parameters = cerealPortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'cereal',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    type: parameters.type,
  };
}

function packageMilkOnCereal(portionSize: FoodPortionSizeMethodsRow): PkgV2MilkOnCerealPsm {
  const parameters = milkOnCerealPortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'milk-on-cereal',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    labels: parameters.labels,
  };
}

function packagePizza(portionSize: FoodPortionSizeMethodsRow): PkgV2PizzaPsm {
  const parameters = pizzaPortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'pizza',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    labels: parameters.labels,
  };
}

function packagePizzaV2(portionSize: FoodPortionSizeMethodsRow): PkgV2PizzaV2Psm {
  const parameters = pizzaV2PortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'pizza-v2',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    labels: parameters.labels,
  };
}

function packageMilkInHotDrink(portionSize: FoodPortionSizeMethodsRow): PkgV2MilkInHotDrinkPsm {
  const parameters = milkInHotDrinkPortionSizeParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'milk-in-a-hot-drink',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    options: parameters.options,
  };
}

function packageParentFoodPortion(portionSize: FoodPortionSizeMethodsRow): PkgV2ParentFoodPortionPsm {
  const parameters = parentFoodPortionParameters.parse(JSON.parse(portionSize.parameters));
  return {
    method: 'parent-food-portion',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
    options: parameters.options,
  };
}

function packageDirectWeight(portionSize: FoodPortionSizeMethodsRow): PkgV2DirectWeightPsm {
  return {
    method: 'direct-weight',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
  };
}

function packageUnknown(portionSize: FoodPortionSizeMethodsRow): PkgV2UnknownPsm {
  return {
    method: 'unknown',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    useForRecipes: portionSize.useForRecipes,
  };
}

export function packagePortionSize(psmRowData: FoodPortionSizeMethodsRow): PkgV2PortionSizeMethod {
  try {
    switch (psmRowData.method) {
      case 'as-served':
        return packageAsServed(psmRowData);
      case 'guide-image':
        return packageGuideImage(psmRowData);
      case 'drink-scale':
        return packageDrinkScale(psmRowData);
      case 'standard-portion':
        return packageStandardPortion(psmRowData);
      case 'cereal':
        return packageCereal(psmRowData);
      case 'milk-on-cereal':
        return packageMilkOnCereal(psmRowData);
      case 'pizza':
        return packagePizza(psmRowData);
      case 'pizza-v2':
        return packagePizzaV2(psmRowData);
      case 'milk-in-a-hot-drink':
        return packageMilkInHotDrink(psmRowData);
      case 'parent-food-portion':
        return packageParentFoodPortion(psmRowData);
      case 'direct-weight':
        return packageDirectWeight(psmRowData);
      case 'unknown':
        return packageUnknown(psmRowData);
      default:
        throw new Error(`Unexpected portion size estimation method: ${psmRowData.method}`);
    }
  }
  catch (err: unknown) {
    if (err instanceof ZodError)
      throw new Error(`Failed to parse portion size method parameters (record ID = ${psmRowData.id}, parameters = ${psmRowData.parameters})`, { cause: err });
    if (err instanceof Error)
      throw new Error(`Failed to parse portion size method data (record ID = ${psmRowData.id}, parameters = ${psmRowData.parameters}): ${err.message}`, { cause: err });
    throw err;
  }
}
