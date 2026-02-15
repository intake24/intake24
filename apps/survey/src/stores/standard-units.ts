import type { StandardUnit } from '@intake24/common/surveys';
import type { StandardUnitResponse } from '@intake24/common/types/http';

import { pick } from 'lodash-es';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useHttp, useI18n } from '@intake24/ui';

export type StandardUnitDef = Pick<StandardUnit, 'name' | 'inlineEstimateIn' | 'inlineHowMany'>;
export type StandardUnitRef = Pick<StandardUnit, 'inlineEstimateIn' | 'inlineHowMany'> & StandardUnitResponse;
export type StandardUnitRefs = Record<string, StandardUnitRef>;

export const useStandardUnits = defineStore('standard-units', () => {
  const http = useHttp();
  const { translate } = useI18n();

  const units = ref<StandardUnitRefs>({});

  function getStandardUnitHowMany(item: string | StandardUnit) {
    if (typeof item === 'string')
      return translate(units.value[item]?.howMany ?? item);

    const { name, inlineHowMany } = item;
    return translate(inlineHowMany ?? units.value[name]?.howMany ?? name);
  };

  function getStandardUnitEstimateIn(item: string | StandardUnit) {
    if (typeof item === 'string')
      return translate(units.value[item]?.estimateIn ?? item);

    const { name, inlineEstimateIn } = item;
    return translate(inlineEstimateIn ?? units.value[name]?.estimateIn ?? name);
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

    const names = items.map(item => typeof item === 'string' ? item : item.name);
    const missing = names.filter(name => !units.value[name]);
    if (!missing.length)
      return;

    await fetchStandardUnits(missing);
  }

  async function fetchStandardUnits(items: (string | StandardUnitDef)[]) {
    if (!items.length)
      return;

    const unitObjects = items.reduce<Record<string, StandardUnitDef>>((acc, item) => {
      const name = typeof item === 'string' ? item : item.name;
      acc[name] = typeof item === 'string' ? { name } : item;

      return acc;
    }, {});

    const { data } = await http.get<StandardUnitResponse[]>('portion-sizes/standard-units', {
      params: { id: Object.keys(unitObjects) },
    });

    data.forEach((item) => {
      units.value[item.id] = {
        ...item,
        ...pick(unitObjects[item.id], ['inlineEstimateIn', 'inlineHowMany']),
      };
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
