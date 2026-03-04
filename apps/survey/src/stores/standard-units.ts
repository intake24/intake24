import type { StandardUnit } from '@intake24/common/surveys';
import type { StandardUnitResponse } from '@intake24/common/types/http';

import { pick } from 'lodash-es';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useHttp, useI18n } from '@intake24/ui';

export type StandardUnitDef = Pick<StandardUnit, 'name' | 'inlineEstimateIn' | 'inlineHowMany'>;

export const useStandardUnits = defineStore('standard-units', () => {
  const http = useHttp();
  const { translate } = useI18n();

  const units = ref<Record<string, StandardUnitResponse>>({});

  function getStandardUnitHowMany(item: string | StandardUnit) {
    if (typeof item !== 'string' && item.inlineHowMany !== undefined)
      return item.inlineHowMany;

    const name = typeof item === 'string' ? item : item.name;
    return translate(units.value[name]?.howMany ?? name);
  };

  function getStandardUnitEstimateIn(item: string | StandardUnit) {
    if (typeof item !== 'string' && item.inlineEstimateIn !== undefined)
      return item.inlineEstimateIn;

    const name = typeof item === 'string' ? item : item.name;
    return translate(units.value[name]?.estimateIn ?? name);
  };

  function getStandardUnit(item: string) {
    return units.value[item];
  }

  function getStandardUnits(items: string[]) {
    return pick(units.value, items);
  }

  async function resolveStandardUnits(items: (string | StandardUnitDef)[]) {
    if (!items.length)
      return;

    const needsFetch: (string | StandardUnitDef)[] = [];

    for (const item of items) {
      const name = typeof item === 'string' ? item : item.name;

      if (units.value[name])
        continue;

      if (typeof item === 'object') {
        const hasEstimateIn = item.inlineEstimateIn !== undefined;
        const hasHowMany = item.inlineHowMany !== undefined;

        if (hasEstimateIn !== hasHowMany)
          console.warn(`Standard unit "${name}" has only one inline value defined: ${hasEstimateIn ? 'inlineEstimateIn' : 'inlineHowMany'}`);

        if (hasEstimateIn || hasHowMany)
          continue;
      }

      needsFetch.push(item);
    }

    if (!needsFetch.length)
      return;

    await fetchStandardUnits(needsFetch.map(item => typeof item === 'string' ? item : item.name));
  }

  async function fetchStandardUnits(names: string[]) {
    if (!names.length)
      return;

    const { data } = await http.get<StandardUnitResponse[]>('portion-sizes/standard-units', {
      params: { id: names },
    });

    data.forEach((item) => {
      units.value[item.id] = item;
    });
  };

  return {
    units,
    getStandardUnit,
    getStandardUnits,
    getStandardUnitHowMany,
    getStandardUnitEstimateIn,
    resolveStandardUnits,
  };
});
