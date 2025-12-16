import { NutrientTypeIdEnum } from '@intake24/common/feedback';
import type { FeedbackSubmissionEntry } from '@intake24/common/types/http';
import { round } from '@intake24/common/util';

export default class SurveyFood {
  readonly code: string;

  readonly englishName: string;

  readonly localName: string;

  readonly nutrientIdConsumptionMap: Map<string, number>;

  constructor(
    code: string,
    englishName: string,
    localName: string,
    nutrients: Map<string, number>,
  ) {
    this.code = code;
    this.englishName = englishName;
    this.localName = localName;
    this.nutrientIdConsumptionMap = new Map(nutrients);
  }

  static fromJson(food: FeedbackSubmissionEntry['meals'][number]['foods'][number]): SurveyFood {
    const mp = new Map(Object.entries(food.nutrients));

    return new SurveyFood(food.code, food.englishName, food.localName ?? '', mp);
  }

  clone(): SurveyFood {
    return new SurveyFood(
      this.code,
      this.englishName,
      this.localName,
      this.nutrientIdConsumptionMap,
    );
  }

  getConsumption(nutrientTypeId: string): number {
    return round(this.nutrientIdConsumptionMap.get(nutrientTypeId) || 0);
  }

  getEnergy(): number {
    return this.getConsumption(NutrientTypeIdEnum.Energy);
  }
}
