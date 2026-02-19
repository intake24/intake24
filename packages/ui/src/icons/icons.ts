// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck
import type { FunctionalComponent } from 'vue';

import FluentEmojiHighContrastSandwich from '~icons/fluent-emoji-high-contrast/sandwich';
import FluentBowlSalad20Filled from '~icons/fluent/bowl-salad-20-filled';
import FluentFoodPizza24Fille from '~icons/fluent/food-pizza-24-filled';
import GameIconsFullPizza from '~icons/game-icons/full-pizza';

export type IconSet = Record<string, FunctionalComponent>;

export const icons: IconSet = {
  'fluent-bowl-salad-20-filled': FluentBowlSalad20Filled,
  'fluent-emoji-high-contrast-sandwich': FluentEmojiHighContrastSandwich,
  'fluent-food-pizza-24-filled': FluentFoodPizza24Fille,
  'game-icons-full-pizza': GameIconsFullPizza,
};

export function getIcon(name?: string | null): FunctionalComponent | undefined {
  return name ? icons[name] : undefined;
};
