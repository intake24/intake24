import type { PortionSizeStates } from '@intake24/common/surveys';
import type { Dictionary } from '@intake24/common/types';

function parseUrlPathname(url?: string | null) {
  if (!url)
    return '';

  try {
    return new URL(url).pathname;
  }
  catch {
    return '';
  }
}

export function genericMapper<T extends keyof PortionSizeStates>(state: PortionSizeStates[T]): Dictionary {
  const { method, ...rest } = state;

  return Object.entries(rest).reduce<Dictionary>((acc, [name, value]) => {
    acc[name] = value?.toString() ?? '';
    return acc;
  }, {});
}

export function asServedMapper(state: PortionSizeStates['as-served']): Dictionary {
  const { leftoversWeight, servingWeight, serving, leftovers, linkedQuantity, quantity } = state;

  return {
    leftovers: (!!leftovers).toString(),
    leftoversImage: parseUrlPathname(leftovers?.imageUrl),
    'leftovers-image-set': leftovers?.asServedSetId ?? '',
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    leftoversChoiceIndex: leftovers?.index?.toString() ?? '',
    linkedQuantity: linkedQuantity.toString(),
    servingImage: parseUrlPathname(serving?.imageUrl),
    'serving-image-set': serving?.asServedSetId ?? '',
    servingWeight: servingWeight?.toString() ?? '0',
    servingChoiceIndex: serving?.index?.toString() ?? '',
    quantity: quantity.toString(),
  };
}

export function cerealMapper(state: PortionSizeStates['cereal']): Dictionary {
  const {
    type,
    bowl,
    bowlId,
    bowlIndex,
    imageUrl,
    leftoversWeight,
    servingWeight,
    serving,
    leftovers,
  } = state;

  return {
    bowl: bowl ?? '',
    bowlId: bowlId?.toString() ?? '',
    bowlIndex: bowlIndex?.toString() ?? '',
    imageUrl: parseUrlPathname(imageUrl),
    leftovers: (!!leftovers).toString(),
    leftoversImage: parseUrlPathname(leftovers?.imageUrl),
    'leftovers-image-set': leftovers?.asServedSetId ?? '',
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    leftoversChoiceIndex: leftovers?.index?.toString() ?? '',
    servingImage: parseUrlPathname(serving?.imageUrl),
    'serving-image-set': serving?.asServedSetId ?? '',
    servingWeight: servingWeight?.toString() ?? '0',
    servingChoiceIndex: serving?.index?.toString() ?? '',
    type,
  };
}

export function directWeightMapper(state: PortionSizeStates['direct-weight']): Dictionary {
  const { leftoversWeight, servingWeight, quantity } = state;

  return {
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
    quantity: quantity?.toString() ?? '0',
  };
}

export function drinkScaleMapper(state: PortionSizeStates['drink-scale']): Dictionary {
  const {
    containerId,
    containerIndex,
    drinkwareId,
    fillLevel,
    imageUrl,
    initialFillLevel,
    leftovers,
    leftoversWeight,
    leftoversLevel,
    servingWeight,
    skipFillLevel,
    quantity,
  } = state;

  return {
    containerId: containerId ?? '',
    containerIndex: containerIndex?.toString() ?? '',
    'drinkware-id': drinkwareId,
    fillLevel: fillLevel.toString(),
    imageUrl: parseUrlPathname(imageUrl),
    'initial-fill-level': initialFillLevel.toString(),
    leftovers: leftovers.toString(),
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    leftoversLevel: leftoversLevel.toString(),
    servingWeight: servingWeight?.toString() ?? '0',
    'skip-fill-level': skipFillLevel.toString(),
    quantity: quantity.toString(),
  };
}

export function guideImageMapper(state: PortionSizeStates['guide-image']): Dictionary {
  const {
    guideImageId,
    imageUrl,
    objectId,
    objectIndex,
    objectWeight,
    leftoversWeight,
    linkedQuantity,
    quantity,
    servingWeight,
  } = state;

  return {
    'guide-image-id': guideImageId,
    imageUrl: parseUrlPathname(imageUrl),
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    linkedQuantity: linkedQuantity.toString(),
    objectId: objectId ?? '',
    objectIndex: objectIndex?.toString() ?? '',
    objectWeight: objectWeight.toString(),
    quantity: quantity.toString(),
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export function milkInAHotDrinkMapper(state: PortionSizeStates['milk-in-a-hot-drink']): Dictionary {
  const { leftoversWeight, servingWeight, milkPartIndex, milkVolumePercentage } = state;

  return {
    milkPartIndex: milkPartIndex?.toString() ?? '',
    milkVolumePercentage: milkVolumePercentage?.toString() ?? '',
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export function parentFoodPortionMapper(state: PortionSizeStates['parent-food-portion']): Dictionary {
  const { leftoversWeight, servingWeight, portionIndex, portionValue } = state;

  return {
    portionIndex: portionIndex?.toString() ?? '',
    portionValue: portionValue?.toString() ?? '',
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export function milkOnCerealMapper(state: PortionSizeStates['milk-on-cereal']): Dictionary {
  const {
    bowl,
    bowlId,
    bowlIndex,
    imageUrl,
    milkLevelId,
    milkLevelIndex,
    milkLevelImage,
    leftoversWeight,
    servingWeight,
  } = state;

  return {
    bowl: bowl ?? '',
    bowlId: bowlId ?? '',
    bowlIndex: bowlIndex?.toString() ?? '',
    imageUrl: parseUrlPathname(imageUrl),
    milkLevelId: milkLevelId ?? '',
    milkLevelChoice: milkLevelIndex?.toString() ?? '',
    milkLevelImage: milkLevelImage ?? '',
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export function pizzaPortionMapper(state: PortionSizeStates['pizza']): Dictionary {
  const { type, thickness, slice, leftoversWeight, servingWeight } = state;

  return {
    typeId: type.id ?? '',
    typeIndex: type.index?.toString() ?? '',
    typeImage: parseUrlPathname(type.image),
    thicknessId: thickness.id ?? '',
    thicknessIndex: thickness.index?.toString() ?? '',
    thicknessImage: parseUrlPathname(type.image),
    sliceId: slice.id ?? '',
    sliceIndex: slice.index?.toString() ?? '',
    sliceImage: parseUrlPathname(slice.image),
    sliceQuantity: slice.quantity?.toString() ?? '',
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export function pizzaV2PortionMapper(state: PortionSizeStates['pizza-v2']): Dictionary {
  const { size, crust, unit, quantity, leftoversWeight, servingWeight } = state;

  return {
    size: size?.toString() ?? '',
    crust: crust?.toString() ?? '',
    unit: unit?.toString() ?? '',
    quantity: quantity.toString(),
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export function standardPortionMapper(state: PortionSizeStates['standard-portion']): Dictionary {
  const { linkedQuantity, quantity, unit, leftoversWeight, servingWeight } = state;

  return {
    linkedQuantity: linkedQuantity.toString(),
    quantity: quantity.toString(),
    unitName: unit?.name ?? '',
    unitWeight: unit?.weight.toString() ?? '',
    unitOmitFoodDescription: unit?.omitFoodDescription.toString() ?? '',
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export function unknownMapper(state: PortionSizeStates['unknown']): Dictionary {
  const { leftoversWeight, servingWeight } = state;

  return {
    leftoversWeight: leftoversWeight?.toString() ?? '0',
    servingWeight: servingWeight?.toString() ?? '0',
  };
}

export const portionSizeMappers: Record<
  keyof PortionSizeStates,
  (...arg: any[]) => Dictionary
> = {
  'as-served': asServedMapper,
  cereal: cerealMapper,
  'direct-weight': directWeightMapper,
  'drink-scale': drinkScaleMapper,
  'guide-image': guideImageMapper,
  'milk-in-a-hot-drink': milkInAHotDrinkMapper,
  'milk-on-cereal': milkOnCerealMapper,
  'parent-food-portion': parentFoodPortionMapper,
  pizza: pizzaPortionMapper,
  'pizza-v2': pizzaV2PortionMapper,
  'recipe-builder': genericMapper,
  'standard-portion': standardPortionMapper,
  unknown: unknownMapper,
};

export type PortionSizeMappers = typeof portionSizeMappers;
