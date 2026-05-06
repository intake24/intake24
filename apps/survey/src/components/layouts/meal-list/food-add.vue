<template>
  <v-dialog v-if="mealTimePrompt" v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600">
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }" />
    </template>
    <v-card>
      <v-toolbar color="primary" variant="tonal">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('recall.menu.food.add') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-divider />
      <v-stepper-vertical v-model="panel" flat>
        <v-stepper-vertical-item
          :complete="mealStepComplete"
          subtitle="Select meal or specify name"
          title="When did you have it?"
          :value="1"
        >
          <v-combobox
            v-model="meal"
            autocomplete="off"
            autofocus
            clearable
            hide-details="auto"
            :items="meals"
            outlined
            return-object
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props" :title="item.raw.name.en">
                <template #append>
                  <v-chip
                    v-if="item.raw.time"
                    color="primary"
                    variant="tonal"
                  >
                    {{ fromTime(item.raw.time) }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              {{ typeof item.raw === 'string' ? item.raw : item.raw.name.en }}
            </template>
          </v-combobox>
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
            <v-btn color="primary" :disabled="!mealStepComplete" @click="next" />
          </template>
          <template #prev />
        </v-stepper-vertical-item>
        <v-stepper-vertical-item
          :complete="foodStepComplete"
          title="What did you have?"
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
                  :title="$t('recall.menu.food.add')"
                  @click="moveToList"
                >
                  fas fa-turn-down fa-rotate-90
                </v-icon>
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
              confirm
            </v-btn>
          </template>
          <template #prev="{ prev }">
            <v-btn variant="plain" @click="prev">
              previous
            </v-btn>
          </template>
        </v-stepper-vertical-item>
      </v-stepper-vertical>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { MealState } from '@intake24/common/surveys';

import { computed, ref, watch } from 'vue';

import { fromTime, toTime } from '@intake24/common/util';
import { timePickers } from '@intake24/survey/components/elements';
import { useSurvey } from '@intake24/survey/stores';

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

const survey = useSurvey();

const mealTimePrompt = computed(() => {
  return survey.parameters?.surveyScheme.prompts.meals.preFoods.find(prompt => prompt.component === 'meal-time-prompt');
});

const dialog = ref(false);
const meal = ref<MealState | string | undefined>(undefined);
const time = ref<string>('8:00');
const foodItems = ref<string[]>([]);
const foodInput = ref('');
const panel = ref<number | undefined>();

const mealStepComplete = computed(() => !!meal.value);
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

  emit('action', 'addFood', typeof meal.value === 'string' ? undefined : meal.value?.id, {
    time: toTime(time.value),
    foods: foods.value,
  });
  close();
}

function remove(idx: number) {
  foodItems.value.splice(idx, 1);
}

function reset() {
  meal.value = undefined;
  time.value = '12:00';
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
