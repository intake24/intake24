<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-col class="px-0 px-sm-3 align-center text-center justify-center" md="8" sm="12">
      <survey-progress-bar :meals="meals" />
      <v-divider />
    </v-col>
    <v-col class="px-0 px-sm-3 align-center text-center justify-center" md="8" sm="12">
      <v-card flat>
        <v-list class="flex-grow-1 flex-shrink-0" density="compact">
          <v-list-item v-for="meal in meals" :key="meal.id" :inactive="true" link :ripple="false">
            <template #prepend>
              <v-icon icon="$meal" />
            </template>
            <v-list-group :value="meal.time ? true : false">
              <template #activator>
                <v-list-item-title
                  class="font-weight-bold text-wrap"
                  @click="chooseMeal(meal.id, meal.name.en, meal.foods, 'meal')"
                >
                  {{ meal.name[$i18n.locale] }}
                </v-list-item-title>
                <v-list-item-action>
                  <span v-if="meal.time">
                    {{ stringTime(meal.time) }}
                  </span>
                  <v-icon v-else icon="$question" size="x-small" />
                </v-list-item-action>
              </template>
              <v-list v-if="meal.foods.length && meal.time ? true : false">
                <v-list-item v-for="(food, i) in meal.foods" :key="i" link>
                  <v-list-item-title
                    class="text-wrap"
                    @click="chooseFood(food.id, foodDisplayName(food), 'food')"
                  >
                    {{ foodDisplayName(food) }}
                  </v-list-item-title>
                  <!-- <v-list-item-action>
                      <v-icon v-if="food.data" color="success" x-small>
                        $ok
                      </v-icon>
                    </v-list-item-action>
                    <v-list-item-action>
                      <v-icon v-if="food.portionSizeMethod" color="success" x-small>
                        $ok
                      </v-icon>
                    </v-list-item-action> -->
                </v-list-item>
              </v-list>
            </v-list-group>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodState, MealState } from '@intake24/common/surveys';
import type { Time } from '@intake24/common/util';

import { fromTime } from '@intake24/common/util';
import { SurveyProgressBar } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'review-confirm-prompt'>(),
  meals: {
    type: Array as PropType<MealState[]>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue', 'action', 'mealSelected', 'foodSelected']);

const { action } = usePromptUtils(props, { emit });
const isValid = true;

function chooseMeal(mealId: string, name: string, foods: FoodState[], entity: string) {
  emit('mealSelected', { mealId, name, foods, entity });
};

function chooseFood(foodId: string, name: string, entity: string) {
  emit('foodSelected', { foodId, name, entity });
};

function foodDisplayName(food: FoodState) {
  let dispalyName = '???';
  if (food.type === 'free-text')
    dispalyName = food.description;
  if (food.type === 'encoded-food')
    dispalyName = food.data.localName;
  if (dispalyName.length > 16)
    dispalyName = dispalyName.slice(0, 16).concat('...');
  return dispalyName;
};
function stringTime(time: Time): string {
  return fromTime(time);
};
</script>

<style lang="scss" scoped></style>
