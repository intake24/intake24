import type { Prompts } from '../prompts';
import type { Time } from '../util';
import type { MealState } from './recall';
import { minutesWrapAround, toMinutes, toTime } from '../util';

export function sortMeals(wakeUpTime: string | null) {
  const wakeUpTimeInMinutes = wakeUpTime ? toMinutes(toTime(wakeUpTime)) : null;

  return function (a: MealState, b: MealState) {
    if (!a.time || !b.time)
      return 0;

    let aTimeInMinutes = toMinutes(a.time);
    let bTimeInMinutes = toMinutes(b.time);

    if (wakeUpTimeInMinutes !== null) {
      if (aTimeInMinutes < wakeUpTimeInMinutes)
        aTimeInMinutes += 1440;

      if (bTimeInMinutes < wakeUpTimeInMinutes)
        bTimeInMinutes += 1440;
    }

    return aTimeInMinutes - bTimeInMinutes;
  };
};

export function isMealAfter(time: Time, after: Time) {
  return time.hours === after.hours ? time.minutes >= after.minutes : time.hours >= after.hours;
}

export function minutesAfterMeal(time: Time, after: Time) {
  return minutesWrapAround(toMinutes(time) - toMinutes(after));
}

export function mealWithStartGap(meal: MealState, startTime: string, gap: number) {
  return meal.time
    && isMealAfter(meal.time, toTime(startTime))
    && minutesAfterMeal(meal.time, toTime(startTime)) > gap
    ? meal
    : undefined;
}

export function isMealBefore(time: Time, before: Time) {
  return time.hours === before.hours ? time.minutes <= before.minutes : time.hours <= before.hours;
}

export function minutesBeforeMeal(time: Time, before: Time) {
  return minutesWrapAround(toMinutes(before) - toMinutes(time));
}

export function mealWithEndGap(meal: MealState, endTime: string, gap: number) {
  return meal.time
    && isMealBefore(meal.time, toTime(endTime))
    && minutesBeforeMeal(meal.time, toTime(endTime)) > gap
    ? meal
    : undefined;
}

export function resolveMealGaps(meals: MealState[], prompt: Prompts['meal-gap-prompt']) {
  const mealSize = meals.length;
  if (!mealSize)
    return [undefined, undefined];

  const firstMeal = meals.at(0);
  const lastMeal = meals.at(mealSize - 1);
  if (!firstMeal || !lastMeal)
    return [undefined, undefined];

  const { gap, startTime, endTime } = prompt;

  const mealStartGap = mealWithStartGap(firstMeal, startTime, gap);
  if (mealStartGap && !mealStartGap.flags.includes('no-meals-before'))
    return [mealStartGap, undefined];

  if (mealSize > 1) {
    for (let i = 0; i < mealSize - 1; i++) {
      const meal = meals.at(i);
      const nextMeal = meals.at(i + 1);
      if (!meal?.time || !nextMeal?.time)
        return [undefined, undefined];

      if (
        minutesBeforeMeal(meal.time, nextMeal.time) > gap
        && isMealAfter(meal.time, toTime(startTime))
        && isMealBefore(nextMeal.time, toTime(endTime))
        && !meal.flags.includes('no-meals-between')
      ) {
        return [meal, nextMeal];
      }
    }
  }

  const mealEndGap = mealWithEndGap(lastMeal, endTime, gap);
  if (mealEndGap && !mealEndGap.flags.includes('no-meals-after'))
    return [undefined, mealEndGap];

  return [undefined, undefined];
}
