<template>
  <v-row justify="center">
    <v-col cols="auto">
      <div class="d-flex flex-column align-center">
        <div v-if="showAll" class="pa-2">
          <v-btn block @click.stop="setAll">
            {{ $t('prompts.linkedAmount.all') }}
          </v-btn>
        </div>

        <p v-if="description" class="mb-2 pb-1 text-body-1">
          {{ description }}
        </p>

        <v-number-input
          :id="inputId"
          v-model="currentWhole"
          :aria-labelledby="inputLabelId"
          class="quantity-field mx-auto"
          :class="{ 'quantity-field--fraction-only': !whole }"
          control-variant="hidden"
          :error-messages="inputError"
          hide-details="auto"
          :label="whole && showInputLabel ? $t('prompts.quantity.accessible.enterWholeNumber') : undefined"
          :readonly="!whole"
          variant="outlined"
          @blur="onBlur"
        >
          <template #append-inner>
            <span
              aria-hidden="true"
              class="fraction-symbol"
            >
              {{ fractionLabel }}
            </span>
            <div class="fraction-controls">
              <v-icon-btn
                :disabled="maxDisabled"
                icon="$upArrow"
                rounded="0"
                :title="$t('prompts.quantity.more')"
                @click.stop="changeValue(stepSize)"
                @mousedown.stop
              />
              <v-icon-btn
                :disabled="minDisabled"
                icon="$downArrow"
                rounded="0"
                :title="$t('prompts.quantity.less')"
                @click.stop="changeValue(-stepSize)"
                @mousedown.stop
              />
            </div>
          </template>
        </v-number-input>

        <label
          v-if="labelKey"
          :id="inputLabelId"
          class="mt-2 text-body-1"
          :class="{ 'quantity-label--hidden': !isQuantityValid }"
          :for="inputId"
        >
          {{ $t(labelKey, { quantity: quantitySummary }) }}
        </label>

        <p aria-atomic="true" aria-live="polite" class="sr-only" role="status">
          {{ quantitySummary }}
        </p>

        <div v-if="confirm" class="pa-3">
          <v-btn block color="primary" :disabled="!isQuantityValid" @click="updateConfirmed(true)">
            {{ $t('prompts.quantity.confirm') }}
          </v-btn>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed, ref, useId, watch } from 'vue';

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
  showInputLabel: {
    type: Boolean,
    default: true,
  },
  labelKey: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'update:confirmed', 'update:valid']);

const { i18n: { t } } = useI18n();

const currentValue = defineModel('modelValue', { type: Number, default: 1 });

const stepSize = computed(() => props.fraction ? 0.25 : 1);

const inputId = useId();
const inputLabelId = `${inputId}-label`;

const wholeInputValue = ref<number | null>(Math.floor(currentValue.value));

const currentFraction = computed(() => normalizeFraction(currentValue.value - Math.floor(currentValue.value)));

const currentWhole = computed<number | null>({
  get: () => props.whole ? wholeInputValue.value : null,
  set: (value) => {
    if (!props.whole)
      return;

    wholeInputValue.value = value;

    if (isValidWhole(value ?? 0))
      currentValue.value = (value ?? 0) + currentFraction.value;
  },
});

const typedInput = computed(() => {
  const typedWhole = wholeInputValue.value ?? 0;

  return props.whole
    ? normalizeFraction(typedWhole + currentFraction.value)
    : currentValue.value;
});

const maxDisabled = computed(() => typedInput.value >= props.max);
const minDisabled = computed(() => typedInput.value <= props.min);

const fractionLabel = computed(() => formatFraction(currentFraction.value));

function formatFraction(value: number) {
  if (!value)
    return '';

  const fraction = value.toFixed(2);

  switch (fraction) {
    case '0.25':
      return '¼';
    case '0.50':
      return '½';
    case '0.75':
      return '¾';
    default:
      return fraction;
  }
}

const minWhole = computed(() => Math.max(0, Math.ceil(props.min - currentFraction.value)));
const maxWhole = computed(() => Math.floor(props.max - currentFraction.value));

function formatQuantity(value: number, fractionSeparator = ' ') {
  const wholeValue = Math.floor(value);
  const fractionValue = normalizeFraction(value - wholeValue);
  const fraction = formatFraction(fractionValue);

  if (!fraction)
    return wholeValue.toString();

  if (!wholeValue)
    return fraction;

  return `${wholeValue}${fractionSeparator}${fraction}`;
}

const quantitySummary = computed(() =>
  formatQuantity(currentValue.value, ` ${t('prompts.quantity.and')} `),
);

const inputError = computed(() => {
  if (!props.whole || isValidWhole(wholeInputValue.value))
    return [];

  return [
    t('prompts.quantity.accessible.invalidNumber', {
      min: formatQuantity(props.min),
      max: formatQuantity(props.max),
    }),
  ];
});

const isQuantityValid = computed(() => inputError.value.length === 0);

watch(isQuantityValid, value => emit('update:valid', value), { immediate: true });

function setAll() {
  currentValue.value = props.max;
  updateConfirmed(true);
};

function clamp(value: number) {
  return Math.min(props.max, Math.max(props.min, value));
};

function isValidWhole(value: number | null): boolean {
  const whole = value ?? 0;
  return whole >= minWhole.value && whole <= maxWhole.value;
}

function changeValue(step: number) {
  const base = typedInput.value;
  const clampedBase = clamp(base);
  // change out of range typed input to the nearest bound, otherwise increment/decrement by step
  currentValue.value = (clampedBase !== base)
    ? clampedBase
    : clamp(normalizeFraction(base + step));
  wholeInputValue.value = Math.floor(currentValue.value);
};

function normalizeFraction(value: number) {
  const normalized = Number(value.toFixed(2));
  return normalized;
}

function updateConfirmed(value: boolean) {
  emit('update:confirmed', value);
};

function onBlur() {
  if (props.whole && wholeInputValue.value === null)
    wholeInputValue.value = 0;
}

watch(currentValue, (value) => {
  if (!(wholeInputValue.value === null && Math.floor(value) === 0))
    wholeInputValue.value = Math.floor(value);

  if (props.confirmed)
    updateConfirmed(false);
});
</script>

<style>
.quantity-field {
  width: 260px;
  max-width: 100%;
}

.quantity-label--hidden {
  visibility: hidden;
}

.quantity-field--fraction-only {
  width: 130px;
}

.quantity-field--fraction-only :deep(input) {
  pointer-events: none;
}

.quantity-field .v-field--appended {
  padding-inline-end: 0;
}

.quantity-field input {
  font-size: 2.5rem;
  text-align: center;
}

.fraction-symbol {
  padding-right: 1.5rem;
  flex: 0 0 3.5rem;
  font-size: 2.5rem;
  text-align: center;
}

.fraction-controls {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  width: 3rem;
  border-left: thin solid rgba(var(--v-border-color), 0.2);
}

.fraction-controls > * {
  flex: 1 1 0;
  width: 100%;
}

.fraction-controls > :first-child {
  border-bottom: thin solid rgba(var(--v-border-color), 0.2);
}

/* error message font size increased for fraction symbol readability */
.quantity-field .v-input__details .v-messages__message {
  font-size: 1rem;
  line-height: 1.2;
}
</style>
