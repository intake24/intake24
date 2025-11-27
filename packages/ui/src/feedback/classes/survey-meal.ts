import type { FeedbackSubmissionEntry } from '@intake24/common/types/http';
import { fromTime } from '@intake24/common/util';
import SurveyFood from './survey-food';

export default class SurveyMeal {
  readonly name;

  readonly hours;

  readonly minutes;

  readonly time;

  readonly duration;

  readonly customFields;

  readonly foods;

  readonly missingFoods;

  constructor(
    name: string | null,
    hours: number,
    minutes: number,
    duration: number | null,
    customFields: { name: string; value: string }[],
    foods: SurveyFood[],
    missingFoods: FeedbackSubmissionEntry['meals'][number]['missingFoods'],
  ) {
    const time = fromTime({ hours, minutes });

    this.name = name ?? `Meal ${time}`;
    this.hours = hours;
    this.minutes = minutes;
    this.time = time;
    this.duration = duration;
    this.customFields = customFields;
    this.foods = foods.map(food => food.clone());
    this.missingFoods = missingFoods.map(food => ({ ...food }));
  }

  clone(): SurveyMeal {
    return new SurveyMeal(
      this.name,
      this.hours,
      this.minutes,
      this.duration,
      this.customFields,
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
      meal.customFields.map(({ name, value }) => ({ name, value })),
      meal.foods.map(food => SurveyFood.fromJson(food)),
      meal.missingFoods.map(food => ({ ...food })),
    );
  }
}
