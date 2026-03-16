// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck
import type { FunctionalComponent } from 'vue';

import FluentFoodPizza24Fille from '~icons/fluent/food-pizza-24-filled';
import GameIconsFullPizza from '~icons/game-icons/full-pizza';

export type IconSet = Record<string, FunctionalComponent>;

const iconsSet: IconSet = {
  'fluent-food-pizza-24-filled': FluentFoodPizza24Fille,
  'game-icons-full-pizza': GameIconsFullPizza,
};

export default iconsSet;
