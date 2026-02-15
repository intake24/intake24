<template>
  <v-sheet
    v-if="standardUnitsLoaded"
    class="d-flex flex-column gr-3 px-3 py-2 justify-space-evenly standard-portion"
    color="grey-lighten-5"
  >
    <v-chip
      v-for="(unit, index) in units"
      :key="unit.name"
      class="px-6 font-weight-medium"
      color="primary"
      :value="index === selectedIndex"
    >
      <v-icon color="primary" size="small" start>
        {{ index !== selectedIndex ? 'far fa-circle' : 'far fa-circle-dot' }}
      </v-icon>
      <i18n-t keypath="prompts.standardPortion.estimateIn">
        <template #unit>
          {{ getStandardUnitEstimateIn(unit) }}
        </template>
      </i18n-t>
    </v-chip>
  </v-sheet>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { UserPortionSizeMethod } from '@intake24/common/types/http/foods';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useStandardUnits } from '../../partials';

defineOptions({ name: 'PortionStandardUnits' });

const props = defineProps({
  max: {
    type: Number,
    default: 4,
  },
  method: {
    type: Object as PropType<UserPortionSizeMethod>,
    required: true,
  },
  timer: {
    type: Number,
  },
});

const units = computed(() => {
  return ('units' in props.method.parameters ? props.method.parameters.units : []).slice(
    0,
    props.max,
  );
});

const { getStandardUnitEstimateIn, standardUnitsLoaded } = useStandardUnits({ units });

const interval = ref<undefined | number>(undefined);
const selectedIndex = ref<undefined | number>(props.timer ? 0 : undefined);

function selectNextStandardUnit() {
  if (typeof selectedIndex.value === 'undefined')
    return;

  selectedIndex.value = (selectedIndex.value + 1) % units.value.length;
}

function startTimer() {
  if (!props.timer)
    return;

  // @ts-expect-error - node types
  interval.value = setInterval(() => {
    selectNextStandardUnit();
  }, props.timer);
}

function clearTimer() {
  clearInterval(interval.value);
}

onMounted(async () => {
  if (!units.value.length)
    return;

  selectNextStandardUnit();
  startTimer();
});

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style lang="scss" scoped>
.standard-portion {
  height: 100%;
  min-height: 180px;

  .v-chip {
    opacity: 0.75;
    pointer-events: none;
    user-select: none;
  }
}
</style>
