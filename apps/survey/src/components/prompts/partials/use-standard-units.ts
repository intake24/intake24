import type { MaybeRefOrGetter } from 'vue';

import type { StandardUnitDef } from '@intake24/survey/stores';

import { computed, onMounted, toRef, watch } from 'vue';

import { useStandardUnits as useStandardUnitsStore } from '@intake24/survey/stores';

export type UseStandardUnitsProps = {
  units: MaybeRefOrGetter<(string | StandardUnitDef)[]>;
};

export function useStandardUnits(props: UseStandardUnitsProps) {
  const units = toRef(props.units);

  const {
    getStandardUnit,
    getStandardUnits,
    getStandardUnitHowMany,
    getStandardUnitEstimateIn,
    resolveStandardUnits,
  } = useStandardUnitsStore();

  const standardUnitsLoaded = computed(() => {
    const names = units.value.map(unit => typeof unit === 'string' ? unit : unit.name);
    const loaded = getStandardUnits(names);
    return Object.keys(loaded).length === names.length;
  });

  watch(units, async (val) => {
    await resolveStandardUnits(val);
  });

  onMounted(async () => {
    await resolveStandardUnits(units.value);
  });

  return {
    getStandardUnit,
    getStandardUnits,
    getStandardUnitHowMany,
    getStandardUnitEstimateIn,
    resolveStandardUnits,
    standardUnitsLoaded,
  };
}
