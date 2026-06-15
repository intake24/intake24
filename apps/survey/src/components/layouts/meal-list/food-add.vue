<template>
  <v-dialog
    v-if="mealTimePrompt"
    v-model="dialog"
    :fullscreen="$vuetify.display.smAndDown"
    max-width="600"
  >
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }" />
    </template>
    <v-card>
      <v-toolbar color="primary" variant="tonal">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('prompts.foodAdd.name') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-divider />
      <v-stepper-vertical v-model="panel" flat>
        <v-stepper-vertical-item
          :complete="mealStepComplete"
          editable
          :title="$t('prompts.foodAdd.meal')"
          :value="1"
        >
          <v-form ref="form" @submit.prevent>
            <v-combobox
              v-model="meal"
              autocomplete="off"
              autofocus
              clearable
              :items="meals"
              outlined
              return-object
              :rules="[inputTooLog(64)]"
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :title="item.name.en">
                  <template #append>
                    <v-chip
                      v-if="item.time"
                      color="primary"
                      variant="tonal"
                    >
                      {{ fromTime(item.time) }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                <v-chip class="font-weight-medium" color="primary">
                  {{ typeof item === 'string' ? item : item.name.en }}
                </v-chip>
              </template>
            </v-combobox>
          </v-form>
          <v-expand-transition>
            <component
              :is="`time-picker-${mealTimePrompt.ui}`"
              v-if="typeof meal === 'string'"
              v-model="time"
              class="mt-4"
              :prompt="mealTimePrompt"
            />
          </v-expand-transition>
          <template #next="{ next }">
            <v-btn color="primary" :disabled="!mealStepComplete" @click="next">
              {{ $t('common.action.continue') }}
            </v-btn>
          </template>
          <template #prev />
        </v-stepper-vertical-item>
        <v-stepper-vertical-item
          :complete="foodStepComplete"
          editable
          :title="$t('prompts.foodAdd.food')"
          :value="2"
        >
          <div class="d-flex">
            <v-text-field
              v-model.trim="foodInput"
              hide-details
              @keydown.prevent.stop.enter="moveToList"
            >
              <template v-if="$vuetify.display.xs" #append>
                <v-icon
                  class="px-2"
                  :disabled="!foodInput.length"
                  icon="fas fa-turn-down fa-rotate-90"
                  :title="$t('recall.menu.food.add')"
                  @click="moveToList"
                />
              </template>
            </v-text-field>
            <v-btn
              v-if="$vuetify.display.smAndUp"
              class="ms-2"
              color="primary"
              :disabled="!foodInput.length"
              height="initial"
              size="x-large"
              :title="$t('recall.menu.food.add')"
              @click="moveToList"
            >
              <v-icon icon="fas fa-turn-down fa-rotate-90" />
            </v-btn>
          </div>
          <v-card
            v-for="(food, idx) in foodItems"
            :key="idx"
            class="d-flex align-center justify-content-between my-2 px-2 gc-2"
            color="primary"
            rounded="pill"
            variant="tonal"
          >
            <v-icon icon="$food" size="small" />
            <div class="flex-grow-1" :title="food">
              {{ food }}
            </div>
            <v-btn
              icon="$delete"
              size="small"
              :title="$t('recall.menu.food.delete')"
              @click="remove(idx)"
            />
          </v-card>
          <template #next>
            <v-btn color="primary" :disabled="!foodStepComplete" @click="confirm">
              {{ $t('common.action.continue') }}
            </v-btn>
          </template>
          <template #prev />
        </v-stepper-vertical-item>
      </v-stepper-vertical>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodCreationState, MealState } from '@intake24/common/surveys';

import { computed, ref, watch } from 'vue';

import { fromTime, toTime } from '@intake24/common/util';
import { timePickers } from '@intake24/survey/components/elements';
import { useForm } from '@intake24/survey/composables';
import { useSurvey } from '@intake24/survey/stores';
import { useI18n } from '@intake24/ui';

defineOptions({
  name: 'FoodAdd',
  components: { ...timePickers },
});

const props = defineProps({
  meals: {
    type: Array as PropType<MealState[]>,
    required: true,
  },
});

const emit = defineEmits(['action']);

const { i18n: { locale } } = useI18n();
const survey = useSurvey();
const { form, inputTooLog } = useForm();

const mealTimePrompt = computed(() =>
  survey.parameters?.surveyScheme.prompts.meals.preFoods.find(prompt => prompt.component === 'meal-time-prompt'));

const dialog = ref(false);
const meal = ref<MealState | string | undefined>(undefined);
const time = ref<string>('8:00');
const foodItems = ref<string[]>([]);
const foodInput = ref('');
const panel = ref<number | undefined>();

const mealStepComplete = computed(() => !!(form.value === null || form.value.isValid) && !!meal.value);
const foods = computed(() => [...foodItems.value, foodInput.value.trim()].filter(Boolean));
const foodStepComplete = computed(() => !!foods.value.length);

const isComplete = computed(() => mealStepComplete.value && foodStepComplete.value);

function moveToList() {
  if (!foodInput.value.length)
    return;

  foodItems.value.push(foodInput.value);
  foodInput.value = '';
}

function confirm() {
  if (!isComplete.value)
    return;

  const id = typeof meal.value === 'string' ? undefined : meal.value!.id;
  const foodCreationState: FoodCreationState = {
    name: typeof meal.value === 'string' ? { en: meal.value.trim(), [locale.value]: meal.value.trim() } : meal.value!.name,
    time: toTime(time.value),
    foods: foods.value,
  };

  emit('action', 'addFood', id, foodCreationState);
  close();
}

function remove(idx: number) {
  foodItems.value.splice(idx, 1);
}

function reset() {
  meal.value = undefined;
  time.value = '8:00';
  foodItems.value = [];
  foodInput.value = '';
  panel.value = undefined;
}

function close() {
  dialog.value = false;
}

function open(mealId?: string) {
  if (mealId)
    meal.value = props.meals.find(m => m.id === mealId);

  dialog.value = true;

  if (mealStepComplete.value)
    panel.value = 2;
}

watch(dialog, (value) => {
  if (!value)
    reset();
});

defineExpose({ open, close });
</script>

<style lang="scss"></style>
