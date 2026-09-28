<template>
  <v-row justify="center">
    <v-col cols="auto">
      <div class="d-flex flex-column align-center">
        <div v-if="showAll" class="pa-2">
          <v-btn block @click.stop="setAll">
            {{ $t('prompts.linkedAmount.all') }}
          </v-btn>
        </div>

        <label
          :id="wholeInputLabelId"
          class="mb-2 text-body-1"
          :for="wholeInputId"
        >
          {{ $t(labelKey, { food: foodText, whole: currentWhole, fraction: fractionLabel }) }}
        </label>

        <v-number-input
          :id="wholeInputId"
          v-model="currentWhole"
          :aria-labelledby="wholeInputLabelId"
          class="quantity-field mx-auto"
          control-variant="hidden"
          hide-details="auto"
          :max="maxWhole"
          :min="0"
          variant="outlined"
          width="160"
          @blur="setMin"
        >
          <template #prepend-inner>
            <v-icon-btn
              :disabled="minDisabled"
              icon="$decrement"
              :title="$t('prompts.quantity.less')"
              @click="decrementFraction"
            />
          </template>
          <template #append-inner>
            <span
              v-if="fractionLabel"
              aria-hidden="true"
              class="fraction-symbol"
            >
              {{ fractionLabel }}
            </span>
            <v-icon-btn
              :disabled="maxDisabled"
              icon="$increment"
              :title="$t('prompts.quantity.more')"
              @click="incrementFraction"
            />
          </template>
        </v-number-input>

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
  labelKey: {
    type: String,
    default: 'prompts.quantity.accessible.total',
  },
});

const emit = defineEmits(['update:modelValue', 'update:confirmed']);

const { i18n: { t } } = useI18n();

const currentValue = defineModel('modelValue', { type: Number, default: 1 });

const wholeInputId = useId();
const wholeInputLabelId = `${wholeInputId}-label`;

const currentWhole = computed<number>({
  get: () => Math.floor(currentValue.value),
  set: (value) => {
    if (value === null || isNaN(value))
      return;
    currentValue.value = clamp(value + currentFraction.value);
  },
});

const currentFraction = computed(() => normalizeFraction(currentValue.value - Math.floor(currentValue.value)));

const maxDisabled = computed(() => currentValue.value === props.max);
const minDisabled = computed(() => currentValue.value === props.min);

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

function clamp(value: number) {
  return Math.min(props.max, Math.max(props.min, value));
};

function incrementFraction() {
  currentValue.value = clamp(normalizeFraction(currentValue.value + 0.25));
};

function decrementFraction() {
  currentValue.value = clamp(normalizeFraction(currentValue.value - 0.25));
};

function setMin() {
  if (currentWhole.value < minWhole.value)
    currentWhole.value = minWhole.value;
};

// function setMin() {
//   if (currentValue.value < props.min || isNaN(currentValue.value)) {
//     currentValue.value = props.min;
//   }
// }

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

.quantity-field {
  max-width: 220px;
}

.fraction-symbol {
  font-size: 1.5rem;
  margin-right: 4px;
  user-select: none;
}
</style>
