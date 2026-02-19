import type { Selectable } from 'kysely';

import type {
  PkgV2AsServedPsm,
  PkgV2AutoPsm,
  PkgV2CerealPsm,
  PkgV2DirectWeightPsm,
  PkgV2DrinkScalePsm,
  PkgV2GuideImagePsm,
  PkgV2MilkInHotDrinkPsm,
  PkgV2MilkOnCerealPsm,
  PkgV2ParentFoodPortionPsm,
  PkgV2PizzaPsm,
  PkgV2PizzaV2Psm,
  PkgV2PortionSizeMethod,
  PkgV2StandardPortionPsm,
  PkgV2UnknownPsm,
} from '@intake24/common/types/package/foods';
import type { FoodPortionSizeMethods } from '@intake24/db/kysely/foods';

import { ZodError } from 'zod';

import {
  asServedPortionSizeParameters,
  autoPortionSizeParameters,
  cerealPortionSizeParameters,
  drinkScalePortionSizeParameters,
  guideImagePortionSizeParameters,
  milkInHotDrinkPortionSizeParameters,
  milkOnCerealPortionSizeParameters,
  parentFoodPortionParameters,
  pizzaPortionSizeParameters,
  pizzaV2PortionSizeParameters,
  standardPortionSizeParameters,
} from '@intake24/common/surveys/portion-size';

type FoodPortionSizeMethodsRow = Pick<Selectable<FoodPortionSizeMethods>, 'id' | 'method' | 'description' | 'conversionFactor' | 'pathways' | 'parameters' | 'orderBy'>;

function packageAsServed(portionSize: FoodPortionSizeMethodsRow): PkgV2AsServedPsm {
  const parameters = asServedPortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'as-served',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    servingImageSet: parameters.servingImageSet,
    leftoversImageSet: parameters.leftoversImageSet ?? undefined,
    multiple: parameters.multiple,
    orderBy: portionSize.orderBy,
  };
}

function packageAuto(portionSize: FoodPortionSizeMethodsRow): PkgV2AutoPsm {
  const parameters = autoPortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'auto',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    orderBy: portionSize.orderBy,
    mode: parameters.mode,
    value: parameters.value,
  };
}

function packageGuideImage(portionSize: FoodPortionSizeMethodsRow): PkgV2GuideImagePsm {
  const parameters = guideImagePortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'guide-image',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    guideImageId: parameters.guideImageId,
    orderBy: portionSize.orderBy,
  };
}

function packageDrinkScale(portionSize: FoodPortionSizeMethodsRow): PkgV2DrinkScalePsm {
  const parameters = drinkScalePortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'drink-scale',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    drinkwareId: parameters.drinkwareId,
    initialFillLevel: parameters.initialFillLevel,
    skipFillLevel: parameters.skipFillLevel,
    orderBy: portionSize.orderBy,
  };
}

function packageStandardPortion(portionSize: FoodPortionSizeMethodsRow): PkgV2StandardPortionPsm {
  const parameters = standardPortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'standard-portion',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    units: parameters.units,
    orderBy: portionSize.orderBy,
  };
}

function packageCereal(portionSize: FoodPortionSizeMethodsRow): PkgV2CerealPsm {
  const parameters = cerealPortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'cereal',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    type: parameters.type,
    orderBy: portionSize.orderBy,
  };
}

function packageMilkOnCereal(portionSize: FoodPortionSizeMethodsRow): PkgV2MilkOnCerealPsm {
  const parameters = milkOnCerealPortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'milk-on-cereal',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    labels: parameters.labels,
    orderBy: portionSize.orderBy,
  };
}

function packagePizza(portionSize: FoodPortionSizeMethodsRow): PkgV2PizzaPsm {
  const parameters = pizzaPortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'pizza',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    labels: parameters.labels,
    orderBy: portionSize.orderBy,
  };
}

function packagePizzaV2(portionSize: FoodPortionSizeMethodsRow): PkgV2PizzaV2Psm {
  const parameters = pizzaV2PortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'pizza-v2',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    labels: parameters.labels,
    orderBy: portionSize.orderBy,
  };
}

function packageMilkInHotDrink(portionSize: FoodPortionSizeMethodsRow): PkgV2MilkInHotDrinkPsm {
  const parameters = milkInHotDrinkPortionSizeParameters.parse(portionSize.parameters);
  return {
    method: 'milk-in-a-hot-drink',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    options: parameters.options,
    orderBy: portionSize.orderBy,
  };
}

function packageParentFoodPortion(portionSize: FoodPortionSizeMethodsRow): PkgV2ParentFoodPortionPsm {
  const parameters = parentFoodPortionParameters.parse(portionSize.parameters);
  return {
    method: 'parent-food-portion',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    options: parameters.options,
    orderBy: portionSize.orderBy,
  };
}

function packageDirectWeight(portionSize: FoodPortionSizeMethodsRow): PkgV2DirectWeightPsm {
  return {
    method: 'direct-weight',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    orderBy: portionSize.orderBy,
  };
}

function packageUnknown(portionSize: FoodPortionSizeMethodsRow): PkgV2UnknownPsm {
  return {
    method: 'unknown',
    description: portionSize.description,
    conversionFactor: portionSize.conversionFactor,
    pathways: portionSize.pathways,
    orderBy: portionSize.orderBy,
  };
}

export function packagePortionSize(psmRowData: FoodPortionSizeMethodsRow): PkgV2PortionSizeMethod {
  try {
    switch (psmRowData.method) {
      case 'as-served':
        return packageAsServed(psmRowData);
      case 'auto':
        return packageAuto(psmRowData);
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
