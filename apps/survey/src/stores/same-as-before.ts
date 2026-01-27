import type { EncodedFood } from '@intake24/common/surveys';

import { defineStore } from 'pinia';

import { portionSizeStates } from '@intake24/common/surveys';

import { useUser } from './user';

export type SameAsBeforeItem = {
  food: EncodedFood;
  localeId: string;
  createdAt: number;
};

export interface SameAsBeforeState {
  items: {
    [userId: string]:
      | {
        [foodCode: string]: SameAsBeforeItem | undefined;
      }
      | undefined;
  };
}

export const useSameAsBefore = defineStore('same-as-before', {
  state: (): SameAsBeforeState => ({ items: {} }),
  persist: true,
  actions: {
    getItem(localeId: string, foodCode: string) {
      const { userId } = useUser();
      if (!userId)
        return undefined;

      const item = this.items[userId]?.[foodCode];
      if (item?.localeId !== localeId)
        return undefined;

      if (!item.food.data.sameAsBeforeOption) {
        this.removeItem(foodCode);
        return undefined;
      }

      if (item.food.portionSize) {
        const { success } = portionSizeStates.shape[item.food.portionSize.method].safeParse(item.food.portionSize);
        if (!success) {
          this.removeItem(foodCode);
          return undefined;
        }
      }

      return item;
    },

    removeItem(foodCode: string) {
      const { userId } = useUser();
      if (!userId)
        return undefined;

      const { [foodCode]: _remove, ...rest } = this.items[userId] ?? {};
      this.items = { ...this.items, [userId]: { ...rest } };
    },

    saveItem(localeId: string, food: EncodedFood) {
      const { userId } = useUser();
      if (!userId)
        return;

      if (!food.data.sameAsBeforeOption)
        return;

      this.items[userId] = { ...(this.items[userId] ?? {}), [food.data.code]: { food, localeId, createdAt: Date.now() } };
      // TODO: Deep-object does not seem to trigger storage save, thought pinia state is updated!
      this.$persist();
    },
  },
});

export type SameAsBeforeStoreDef = typeof useSameAsBefore;

export type SameAsBeforeStore = ReturnType<SameAsBeforeStoreDef>;
