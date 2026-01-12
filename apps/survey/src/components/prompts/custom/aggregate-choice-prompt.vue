<template>
  <component :is="customPromptLayout" v-bind="{ food, meal, prompt, section, isValid }" @action="action">
    <v-card flat>
      <v-list v-model:opened="opened" density="compact">
        <v-list-group v-for="meal in filteredMeals" :key="meal.id" :value="meal.id">
          <template #activator="{ props }">
            <v-list-item class="text-primary">
              <v-list-item-title class="font-weight-bold text-wrap" v-bind="props">
                {{ translate(meal.name) }}
              </v-list-item-title>
              <template #append>
                <v-list-item-action>
                  <span v-if="meal.time">
                    {{ getMealTime(meal) }}
                  </span>
                  <v-icon v-else icon="$question" size="x-small" />
                </v-list-item-action>
              </template>
            </v-list-item>
          </template>
          <v-list-item class="pa-0" :style="{ 'padding-inline-start': '0 !important' }">
            <v-container :class="{ 'px-4 py-2': $vuetify.display.mobile }">
              <template v-if="$vuetify.display.mobile || localeOptions.length > 3">
                <v-row
                  v-for="food in meal.foods"
                  :key="food.id"
                  align="center"
                  class="mb-2"
                  no-gutters
                >
                  <v-col cols="12" md="4">
                    <span class="food-label">{{ getFoodName(food) }}</span>
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-select
                      v-model="promptAnswers[food.id]"
                      class="option-label"
                      density="compact"
                      hide-details="auto"
                      item-title="label"
                      item-value="value"
                      :items="localeOptions"
                      @update:model-value="updatePromptAnswers()"
                    />
                  </v-col>
                </v-row>
              </template>
              <template v-else>
                <v-row class="mb-4" no-gutters>
                  <v-col cols="3" />
                  <v-col v-for="(option, index) in localeOptions" :key="index" class="d-flex justify-center" cols="3">
                    <label class="option-label">{{ option.label }}</label>
                  </v-col>
                </v-row>
                <v-radio-group
                  v-for="food in meal.foods"
                  :key="food.id"
                  v-model="promptAnswers[food.id]"
                  density="compact"
                  hide-details="auto"
                  inline
                  @update:model-value="updatePromptAnswers()"
                >
                  <v-row class="mb-4" no-gutters>
                    <v-col cols="3">
                      <span class="food-label">{{ getFoodName(food) }}</span>
                    </v-col>
                    <v-col v-for="(option, optIndex) in localeOptions" :key="optIndex" class="d-flex justify-center" cols="3">
                      <v-radio :value="option.value" />
                    </v-col>
                  </v-row>
                </v-radio-group>
              </template>
            </v-container>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-card>
    <template #actions>
      <next :disabled="!isValid" @click="action('next')" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed, ref } from 'vue';
import type { CustomPromptAnswer, MealState } from '@intake24/common/surveys';
import { copy } from '@intake24/common/util';
import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';
import { BaseLayout, CardLayout, PanelLayout } from '../layouts';
import { Next } from '../partials';
import { createBasePromptProps } from '../prompt-props';

defineOptions({
  name: 'AggregateChoicePrompt',
  components: { BaseLayout, CardLayout, PanelLayout },
});

const props = defineProps({
  ...createBasePromptProps<'aggregate-choice-prompt'>(),
  modelValue: {
    type: Object as PropType<Record<string, CustomPromptAnswer | undefined>>,
    required: true,
  },
  filteredMeals: {
    type: Array as PropType<MealState[]>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { i18n: { locale }, translate } = useI18n();
const { action, getFoodName, getMealTime, customPromptLayout } = usePromptUtils(props, { emit });

const opened = ref(props.filteredMeals.map(meal => meal.id));
const promptAnswers = ref(copy(props.modelValue));

const localeOptions = computed(
  () => props.prompt.options[locale.value] ?? props.prompt.options.en,
);
const isValid = computed(() => props.filteredMeals.every(meal => meal.foods.every(food => props.modelValue[food.id] !== undefined)));

function updatePromptAnswers() {
  emit('update:modelValue', promptAnswers.value);
}

defineExpose({ isValid });
</script>

<style lang="scss" scoped>
@media (max-width: 768px) {
  .option-label {
    font-size: smaller;
  }
  .food-label {
    font-size: smaller;
  }
}
</style>
