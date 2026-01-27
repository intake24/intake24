import type { StoreDefinition } from 'pinia';

import type { ComponentType } from '@intake24/common/prompts';

import { defineStore } from 'pinia';

interface FoodOrMealPromptsState<T> {
  prompts: {
    [key: string]: { [key: string]: T };
  };
}

export const promptStores = new Map<ComponentType, StoreDefinition>();

function storageKey(promptType: ComponentType): string {
  return `${promptType}-state`;
}

export function clearPromptStores(): void {
  for (const [promptType, storeDef] of promptStores) {
    storeDef().$dispose();
    localStorage.removeItem(storageKey(promptType));
  }
  promptStores.clear();
}

export function getOrCreatePromptStateStore<T extends object>(
  promptType: ComponentType,
): StoreDefinition {
  let storeDef = promptStores.get(promptType);

  if (storeDef === undefined) {
    const storageKey = `${promptType}-state`;

    storeDef = defineStore(`${promptType}-state`, {
      state: (): FoodOrMealPromptsState<T> => ({
        prompts: {},
      }),
      persist: {
        key: storageKey,
      },
      actions: {
        updateState(foodOrMealId: string, promptId: string, data: T) {
          this.prompts = {
            ...this.prompts,
            [foodOrMealId]: { ...this.prompts[foodOrMealId], [promptId]: data },
          };
        },
        clearState(foodOrMealId: string | string[], promptId?: string) {
          const ids = Array.isArray(foodOrMealId) ? foodOrMealId : [foodOrMealId];
          if (!promptId) {
            ids.forEach((id) => {
              delete this.prompts[id];
            });
          }
          else {
            ids.forEach((id) => {
              if (this.prompts[id]?.[promptId])
                delete this.prompts[id][promptId];
            });
          }

          this.prompts = Object.fromEntries(
            Object.entries(this.prompts).filter(e => Object.keys(e[1]).length),
          );

          // Dispose store if it is empty
          if (!Object.keys(this.prompts).length) {
            this.$dispose();
            promptStores.delete(promptType);
            localStorage.removeItem(storageKey);
          }
        },
      },
    });

    promptStores.set(promptType, storeDef);
  }

  return storeDef;
}
