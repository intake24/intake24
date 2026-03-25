import type { StoreDefinition } from 'pinia';

import type { ComponentType } from '@intake24/common/prompts';

import { defineStore } from 'pinia';

interface FoodOrMealPromptsState<T> {
  prompts: {
    [key: string]: { [key: string]: T };
  };
}

export const promptStores = new Map<ComponentType, StoreDefinition>();

function storeId(promptType: ComponentType): string {
  return `${promptType}-state`;
}

function storageKey(promptType: ComponentType): string {
  const prefix = import.meta.env.VITE_APP_PREFIX ?? '';
  return `${prefix}${storeId(promptType)}`;
}

export function clearPromptStores(): void {
  for (const [promptType, storeDef] of promptStores) {
    storeDef().$dispose();
    localStorage.removeItem(storageKey(promptType));
  }
  promptStores.clear();
}

export function getOrCreatePromptStateStore<T>(
  promptType: ComponentType,
): StoreDefinition {
  let storeDef = promptStores.get(promptType);

  if (storeDef === undefined) {
    const id = storeId(promptType);

    storeDef = defineStore(id, {
      state: (): FoodOrMealPromptsState<T> => ({
        prompts: {},
      }),
      persist: {
        key: id,
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
            localStorage.removeItem(storageKey(promptType));
          }
        },
      },
    });

    promptStores.set(promptType, storeDef);
  }

  return storeDef;
}
