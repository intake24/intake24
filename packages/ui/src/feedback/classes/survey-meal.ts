import type { CustomData } from '@intake24/common/surveys';
import type { FeedbackSubmissionEntry } from '@intake24/common/types/http';

import { fromTime } from '@intake24/common/util';

import SurveyFood from './survey-food';

export default class SurveyMeal {
  readonly name;

  readonly hours;

  readonly minutes;

  readonly time;

  readonly duration;

  readonly customData;

  readonly foods;

  readonly missingFoods;

  constructor(
    name: string | null,
    hours: number,
    minutes: number,
    duration: number | null,
    customData: CustomData,
    foods: SurveyFood[],
    missingFoods: FeedbackSubmissionEntry['meals'][number]['missingFoods'],
  ) {
    const time = fromTime({ hours, minutes });

    this.name = name ?? `Meal ${time}`;
    this.hours = hours;
    this.minutes = minutes;
    this.time = time;
    this.duration = duration;
    this.customData = customData;
    this.foods = foods.map(food => food.clone());
    this.missingFoods = missingFoods.map(food => ({ ...food }));
  }

  clone(): SurveyMeal {
    return new SurveyMeal(
      this.name,
      this.hours,
      this.minutes,
      this.duration,
      this.customData,
      this.foods,
      this.missingFoods,
    );
  }

  static fromJson(meal: FeedbackSubmissionEntry['meals'][number]): SurveyMeal {
    return new SurveyMeal(
      meal.name,
      meal.hours,
      meal.minutes,
      meal.duration,
      meal.customData,
      meal.foods.map(food => SurveyFood.fromJson(food)),
      meal.missingFoods.map(food => ({ ...food })),
    );
  }
}
