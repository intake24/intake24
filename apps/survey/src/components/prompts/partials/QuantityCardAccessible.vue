<template>
  <v-row justify="center">
    <v-col cols="auto">
      <div class="d-flex flex-column align-center">
        <div v-if="showAll" class="pa-2">
          <v-btn block @click.stop="setAll">
            {{ $t('prompts.linkedAmount.all') }}
          </v-btn>
        </div>
        <v-card class="pa-4" variant="outlined">
          <div v-if="whole" class="d-flex flex-column ga-2">
            <label
              :id="wholeInputLabelId"
              class="mb-0 text-body-1"
              :for="wholeInputId"
            >
              {{ $t('prompts.quantity.accessible.whole', { food: foodText }) }}
            </label>
            <v-number-input
              :id="wholeInputId"
              v-model="currentWhole"
              :aria-labelledby="wholeInputLabelId"
              :max="maxWhole"
              :min="minWhole"
              variant="outlined"
            />
          </div>

          <div v-if="fraction" class="d-flex flex-column ga-2" :class="{ 'mt-4': whole }">
            <label
              :id="fractionInputLabelId"
              class="mb-0 text-body-1"
              :for="fractionInputId"
            >
              {{ $t('prompts.quantity.accessible.fraction', { food: foodText }) }}
            </label>
            <v-select
              :id="fractionInputId"
              v-model="currentFraction"
              :aria-labelledby="fractionInputLabelId"
              :items="fractionOptions"
              variant="outlined"
            />
          </div>
        </v-card>

        <p aria-atomic="true" aria-live="polite" class="sr-only" role="status">
          {{ $t('prompts.quantity.accessible.currentSelection', { selection: quantitySummary }) }}
        </p>

        <div v-if="confirm" class="pa-3">
          <v-btn block color="primary" @click="updateConfirmed(true)">
            {{ $t('prompts.quantity.confirm') }}
          </v-btn>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed, useId, watch } from 'vue';

import { useI18n } from '@intake24/ui';

defineOptions({ name: 'QuantityCardAccessible' });

const props = defineProps({
  confirm: {
    type: Boolean,
    default: true,
  },
  min: {
    type: Number,
    default: 0.25,
  },
  max: {
    type: Number,
    default: 30,
  },
  showAll: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Number,
    default: 1,
  },
  confirmed: {
    type: Boolean,
    default: true,
  },
  fraction: {
    type: Boolean,
    default: true,
  },
  whole: {
    type: Boolean,
    default: true,
  },
  foodLabel: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'update:confirmed']);

const { i18n: { t } } = useI18n();

const currentValue = defineModel('modelValue', { type: Number, default: 1 });

const wholeInputId = useId();
const wholeInputLabelId = `${wholeInputId}-label`;
const fractionInputId = useId();
const fractionInputLabelId = `${fractionInputId}-label`;

const currentWhole = computed<number>({
  get: () => Math.floor(currentValue.value),
  set: (value) => {
    currentValue.value = value + currentFraction.value;
  },
});

const currentFraction = computed<number>({
  get: () => normalizeFraction(currentValue.value - Math.floor(currentValue.value)),
  set: (value) => {
    currentValue.value = currentWhole.value + value;
  },
});

const fractionLabel = computed(() => {
  if (!currentFraction.value)
    return currentFraction.value;

  const fraction = currentFraction.value.toFixed(2);

  switch (fraction) {
    case '0.25':
      return '¼';
    case '0.33':
      return '⅓';
    case '0.50':
      return '½';
    case '0.67':
      return '⅔';
    case '0.75':
      return '¾';
    default:
      return fraction.toString();
  }
});

const foodText = computed(() => props.foodLabel.trim() || t('prompts.quantity.accessible.food'));

const minWhole = computed(() => Math.floor(props.min));
const maxWhole = computed(() => Math.floor(props.max));

const fractionOptions = computed(() => [
  { title: '0', value: 0 },
  { title: '¼', value: 0.25 },
  { title: '⅓', value: 0.33 },
  { title: '½', value: 0.5 },
  { title: '⅔', value: 0.67 },
  { title: '¾', value: 0.75 },
]);

const quantitySummary = computed(() => {
  const wholeValue = currentWhole.value;
  const fractionValue = currentFraction.value;

  if (!fractionValue)
    return wholeValue.toString();

  if (!wholeValue)
    return fractionLabel.value;

  return `${wholeValue} ${t('prompts.quantity.and')} ${fractionLabel.value}`;
});

function setAll() {
  currentValue.value = props.max;
  updateConfirmed(true);
};

function normalizeFraction(value: number) {
  const normalized = Number(value.toFixed(2));
  return normalized;
}

function updateConfirmed(value: boolean) {
  emit('update:confirmed', value);
};

watch(currentValue, () => {
  if (props.confirmed)
    updateConfirmed(false);
});
</script>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
