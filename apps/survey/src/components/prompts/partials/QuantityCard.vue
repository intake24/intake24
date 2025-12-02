<template>
  <v-row justify="center">
    <v-col cols="auto">
      <div class="d-flex flex-column align-center">
        <div v-if="showAll" class="pa-2">
          <v-btn block @click.stop="setAll">
            {{ $t('prompts.linkedAmount.all') }}
          </v-btn>
        </div>
        <div class="pa-2 d-flex flex-row">
          <div v-if="whole" class="d-flex flex-column align-center">
            <v-card class="d-flex flex-column align-center pa-5 rounded-pill">
              <v-btn
                color="secondary"
                :disabled="maxDisabled"
                icon
                size="x-large"
                :title="$t('prompts.quantity.more')"
                @click="update(1)"
              >
                <v-icon aria-hidden="false">
                  $increment
                </v-icon>
              </v-btn>
              <span class="my-4 font-weight-medium text-h4">{{ wholeLabel }}</span>
              <v-btn
                color="secondary"
                :disabled="minDisabled"
                icon
                size="x-large"
                :title="$t('prompts.quantity.less')"
                @click="update(-1)"
              >
                <v-icon aria-hidden="false">
                  $decrement
                </v-icon>
              </v-btn>
            </v-card>
          </div>
          <div v-if="whole && fraction" class="d-flex flex-column justify-center align-center mx-6">
            <span class="font-weight-medium">{{ $t('prompts.quantity.and') }}</span>
          </div>
          <div v-if="fraction" class="d-flex flex-column align-center">
            <v-card class="d-flex flex-column align-center pa-5 rounded-pill">
              <v-btn
                color="secondary"
                :disabled="maxDisabled"
                icon
                size="x-large"
                :title="$t('prompts.quantity.more')"
                @click="incrementFraction"
              >
                <v-icon aria-hidden="false">
                  $increment
                </v-icon>
              </v-btn>
              <span class="my-4 font-weight-medium text-h4">{{ fractionLabel }}</span>
              <v-btn
                color="secondary"
                :disabled="minDisabled"
                icon
                size="x-large"
                :title="$t('prompts.quantity.less')"
                @click="decrementFraction"
              >
                <v-icon aria-hidden="false">
                  $decrement
                </v-icon>
              </v-btn>
            </v-card>
          </div>
        </div>
        <div v-if="whole && fraction" class="px-3 d-flex flex-row justify-space-between align-self-stretch">
          <span v-if="whole" class="font-weight-medium text-button">
            {{ $t('prompts.quantity.whole') }}
          </span>
          <span v-if="fraction" class="font-weight-medium text-button">
            {{ $t('prompts.quantity.fraction') }}
          </span>
        </div>
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
import { computed, watch } from 'vue';

defineOptions({ name: 'QuantityCard' });

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
});

const emit = defineEmits(['update:modelValue', 'update:confirmed']);

const fractions = [1 / 4, 1 / 2, 3 / 4];
const reversedFractions = computed(() => fractions.toReversed());

const currentValue = defineModel('modelValue', { type: Number, default: 1 });

const currentWhole = computed(() => Math.floor(currentValue.value));
const currentFraction = computed(() => currentValue.value - currentWhole.value);

const maxDisabled = computed(() => currentValue.value === props.max);
const minDisabled = computed(() => currentValue.value === props.min);

const wholeLabel = computed(() => currentWhole.value.toString());
const fractionLabel = computed(() => {
  if (!currentFraction.value)
    return currentFraction.value;

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

function setAll() {
  update(props.max);
  updateConfirmed(true);
};

function clamp(value: number) {
  return Math.min(props.max, Math.max(props.min, value));
};

function update(value: number) {
  currentValue.value = clamp(currentValue.value + value);
};

function incrementFraction() {
  const nextFraction = fractions.find(fraction => fraction.toFixed(2) > currentFraction.value.toFixed(2)) ?? 1;
  currentValue.value = clamp(currentWhole.value + nextFraction);
};
function decrementFraction() {
  if (!currentFraction.value) {
    currentValue.value = clamp(currentWhole.value - 1 + (fractions.at(-1) ?? 0));
    return;
  }

  const prevFraction = reversedFractions.value.find(fraction => fraction.toFixed(2) < currentFraction.value.toFixed(2)) ?? 0;
  currentValue.value = clamp(currentWhole.value + prevFraction);
};

function updateConfirmed(value: boolean) {
  emit('update:confirmed', value);
};

watch(currentValue, () => {
  if (props.confirmed)
    updateConfirmed(false);
});
</script>

<style></style>
