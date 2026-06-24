import type { EncodedFood } from '@intake24/common/surveys';

import { foodsService } from '@intake24/survey/services';

type ReplaceFoodFn = (data: { foodId: string; food: EncodedFood }) => void;

type ReplaceFoodByCodeParams = {
  food: EncodedFood | undefined;
  foodCode: string | undefined;
  localeId: string;
  replaceFood: ReplaceFoodFn;
  source: string;
};

export async function replaceFoodByCode({
  food,
  foodCode,
  localeId,
  replaceFood,
  source,
}: ReplaceFoodByCodeParams) {
  const code = foodCode?.trim();
  const foodId = food?.id;

  if (!foodId || !code || code === 'NO_UPDATE')
    return;

  try {
    const foodData = await foodsService.getData(localeId, code);
    const newFood: EncodedFood = {
      id: foodId,
      type: 'encoded-food',
      data: foodData,
      searchTerm: food.searchTerm ?? '',
      portionSizeMethodIndex: null,
      portionSize: null,
      customPromptAnswers: food.customPromptAnswers ?? {},
      flags: food.flags ?? [],
      linkedFoods: [],
    };

    replaceFood({ foodId, food: newFood });
  }
  catch (error) {
    console.error(`${source} failed to replace food:`, error);
  }
}
