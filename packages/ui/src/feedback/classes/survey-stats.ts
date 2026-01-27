import type SurveyFood from './survey-food';
import type SurveyMeal from './survey-meal';
import type { FeedbackSubmissionEntry } from '@intake24/common/types/http';

import AggregateFoodStats from './aggregate-food-stats';
import SurveySubmission from './survey-submission';

export type FruitAndVegPortions = {
  readonly juices: number;
  readonly beansAndPulses: number;
  readonly fruit: number;
  readonly driedFruit: number;
  readonly vegetables: number;
  readonly total: number;
};

export interface MealStats
  extends Pick<SurveyMeal, 'name' | 'hours' | 'minutes' | 'time' | 'duration' | 'customData'> {
  readonly stats: AggregateFoodStats;
}

export default class SurveyStats {
  readonly submissions;

  constructor(submissions: SurveySubmission[]) {
    this.submissions = submissions.map(ss => ss.clone());
  }

  clone() {
    return new SurveyStats(this.submissions);
  }

  static fromJson(jsonList: FeedbackSubmissionEntry[]) {
    return new SurveyStats(jsonList.map(js => SurveySubmission.fromJson(js)));
  }

  // Returns a flat array of all food records for the selected day or for all days
  // if no day is selected
  private getFoods(selected: string[]) {
    return this.submissions
      .filter(submission => selected.includes(submission.id))
      .flatMap(submission => submission.getFoods());
  }

  private getMeals(selected: string) {
    return this.submissions.find(submission => submission.id === selected)?.meals ?? [];
  }

  private readonly JUICE_NUTRIENT_IDS = ['254', '255'];

  private readonly FRUIT_NUTRIENT_IDS = ['252'];

  private readonly DRIED_FRUIT_NUTRIENT_IDS = ['253'];

  private readonly VEGETABLE_NUTRIENT_IDS = ['262', '256', '257', '258', '259'];

  private readonly BEANS_PULSES_NUTRIENT_IDS = ['260'];

  private static getTotalForSubset(nutrientIntake: Map<string, number>, nutrientIds: string[]) {
    let total = 0;

    nutrientIntake.forEach((weight, groupId) => {
      if (nutrientIds.includes(groupId))
        total += weight;
    });

    return total;
  }

  getFruitAndVegPortions(selected: string[]): FruitAndVegPortions {
    const averages = this.getAverageIntake(selected);

    const juicesTotal = SurveyStats.getTotalForSubset(averages, this.JUICE_NUTRIENT_IDS);
    const beansAndPulsesTotal = SurveyStats.getTotalForSubset(
      averages,
      this.BEANS_PULSES_NUTRIENT_IDS,
    );
    const fruitTotal = SurveyStats.getTotalForSubset(averages, this.FRUIT_NUTRIENT_IDS);
    const driedFruitTotal = SurveyStats.getTotalForSubset(averages, this.DRIED_FRUIT_NUTRIENT_IDS);
    const vegetablesTotal = SurveyStats.getTotalForSubset(averages, this.VEGETABLE_NUTRIENT_IDS);

    const juices = Math.min(150, juicesTotal) / 150;
    const beansAndPulses = Math.min(80, beansAndPulsesTotal) / 80;
    const fruit = fruitTotal / 80;
    const driedFruit = driedFruitTotal / 30;
    const vegetables = vegetablesTotal / 80;

    return {
      juices,
      beansAndPulses,
      fruit,
      driedFruit,
      vegetables,
      total: juices + beansAndPulses + fruit + driedFruit + vegetables,
    };
  }

  getAverageIntake(selected: string[], foods?: SurveyFood[]) {
    const averageIntake = new Map<string, number>();

    (foods ?? this.getFoods(selected)).forEach((food) => {
      for (const [key, value] of food.nutrientIdConsumptionMap.entries()) {
        if (!averageIntake.has(key))
          averageIntake.set(key, 0);

        averageIntake.set(key, (averageIntake.get(key) as number) + value);
      }
    });

    if (selected.length === 1)
      return averageIntake;

    for (const [key, value] of averageIntake.entries())
      averageIntake.set(key, value / selected.length);

    return averageIntake;
  }

  getMealStats(selected: string): MealStats[] {
    return this.getMeals(selected).map((meal, idx) => {
      const name = meal.name ?? `Meal #${idx + 1}`;

      const averageIntake = this.getAverageIntake([selected], meal.foods);

      const stats = new AggregateFoodStats(name, averageIntake);

      return { ...meal, name, stats };
    });
  }

  getReducedFoods(selected: string[]) {
    const foods = this.getFoods(selected);

    return [...new Set(foods.map(f => f.code))].map((code) => {
      const totalConsumptionMap: Map<string, number> = new Map();
      const matchingFoods = foods.filter(f => f.code === code);

      matchingFoods.forEach((f) => {
        for (const [key, value] of f.nutrientIdConsumptionMap.entries()) {
          if (!totalConsumptionMap.has(key))
            totalConsumptionMap.set(key, 0);

          totalConsumptionMap.set(key, (totalConsumptionMap.get(key) as number) + value);
        }
      });
      // We need to get average consumption per day.
      // At the moment we do that by getting average consumption of nutrient per one submission
      for (const [key, value] of totalConsumptionMap.entries())
        totalConsumptionMap.set(key, value / selected.length);

      const firstFood = matchingFoods[0];
      return new AggregateFoodStats(firstFood.localName, totalConsumptionMap);
    });
  }
}
