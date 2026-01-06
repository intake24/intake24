<template>
  <v-sheet
    v-if="standardUnitsLoaded"
    class="d-flex flex-column gr-3 px-3 py-2 justify-space-evenly standard-portion"
    color="grey-lighten-5"
  >
    <v-chip
      v-for="(unit, index) in translatedUnits"
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
          {{ unit.translatedEstimateIn }}
        </template>
      </i18n-t>
    </v-chip>
  </v-sheet>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';

import type { UserPortionSizeMethod } from '@intake24/common/types/http/foods';

import { useStandardUnits } from '../../partials';

export default defineComponent({
  name: 'PortionStandardUnits',

  props: {
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
  },

  setup(props) {
    const { getStandardUnitEstimateIn, resolveStandardUnits, standardUnitsLoaded, currentLocale } = useStandardUnits();

    const interval = ref<undefined | number>(undefined);
    const selectedIndex = ref<undefined | number>(props.timer ? 0 : undefined);

    const standardUnits = computed(() => {
      return ('units' in props.method.parameters ? props.method.parameters.units : []).slice(
        0,
        props.max,
      );
    });

    // Create computed translations that explicitly depend on locale changes
    const translatedUnits = computed(() => {
      // Access currentLocale to create reactive dependency
      const _locale = currentLocale.value;
      return standardUnits.value.map(unit => ({
        ...unit,
        translatedEstimateIn: getStandardUnitEstimateIn(unit),
      }));
    });

    const selectNextStandardUnit = () => {
      if (typeof selectedIndex.value === 'undefined')
        return;

      selectedIndex.value = (selectedIndex.value + 1) % standardUnits.value.length;
    };

    const startTimer = () => {
      if (!props.timer)
        return;

      // @ts-expect-error - node types
      interval.value = setInterval(() => {
        selectNextStandardUnit();
      }, props.timer);
    };

    const clearTimer = () => {
      clearInterval(interval.value);
    };

    onMounted(async () => {
      if (!standardUnits.value.length)
        return;

      const names = standardUnits.value
        .filter(unit => unit.inlineEstimateIn === undefined)
        .map(unit => unit.name);

      await resolveStandardUnits(names);

      selectNextStandardUnit();
      startTimer();
    });

    onBeforeUnmount(() => {
      clearTimer();
    });

    return {
      selectedIndex,
      standardUnitsLoaded,
      translatedUnits,
    };
  },
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
