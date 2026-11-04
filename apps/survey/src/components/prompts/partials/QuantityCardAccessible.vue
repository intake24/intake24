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
          hide-details="auto"
          :label="whole && showInputLabel ? $t('prompts.quantity.accessible.enterWholeNumber') : undefined"
          :max="maxWhole"
          :min="0"
          :readonly="!whole"
          variant="outlined"
          @blur="setLimits"
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
          :for="inputId"
        >
          {{ $t(labelKey, { quantity: quantitySummary }) }}
        </label>

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

const emit = defineEmits(['update:modelValue', 'update:confirmed']);

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

    if (value === null || Number.isNaN(value)) {
      wholeInputValue.value = value;
      return;
    }
    currentValue.value = clamp(value + currentFraction.value);
    wholeInputValue.value = Math.floor(currentValue.value);
  },
});

const maxDisabled = computed(() => currentValue.value >= props.max);
const minDisabled = computed(() => currentValue.value <= props.min);

const fractionLabel = computed(() => {
  if (!currentFraction.value)
    return '';

  const fraction = currentFraction.value.toFixed(2);

  switch (fraction) {
    case '0.25':
      return '¼';
    case '0.50':
      return '½';
    case '0.75':
      return '¾';
    default:
      return fraction.toString();
  }
});

const minWhole = computed(() => Math.floor(props.min));
const maxWhole = computed(() => Math.floor(props.max));

const quantitySummary = computed(() => {
  const wholeValue = currentWhole.value ?? 0;
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

function changeValue(step: number) {
  currentValue.value = clamp(normalizeFraction(currentValue.value + step));
};

function setLimits() {
  if (!props.whole)
    return;

  if (currentWhole.value === null || Number.isNaN(currentWhole.value)) {
    currentWhole.value = minWhole.value;
  }
};

function normalizeFraction(value: number) {
  const normalized = Number(value.toFixed(2));
  return normalized;
}

function updateConfirmed(value: boolean) {
  emit('update:confirmed', value);
};

watch(currentValue, (value) => {
  wholeInputValue.value = Math.floor(value);

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
  width: 260px;
  max-width: 100%;
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
</style>
