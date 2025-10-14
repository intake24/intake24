import { computed, ref } from 'vue';

import type { StandardUnit } from '@intake24/common/surveys';
import type { RequiredLocaleTranslation } from '@intake24/common/types';
import type { StandardUnitResponse } from '@intake24/common/types/http';
import { useI18n } from '@intake24/i18n';
import { useHttp } from '@intake24/survey/services';

export type StandardUnitRefs = Record<
  string,
  { estimateIn: RequiredLocaleTranslation; howMany: RequiredLocaleTranslation }
>;

// Global shared state to prevent race conditions
const globalStandardUnitRefs = ref<StandardUnitRefs>({});
const globalLoadingUnits = ref(false);
const globalHasApiData = ref(false);

export function useStandardUnits() {
  const http = useHttp();
  const { translate } = useI18n();

  // Use shared global state instead of instance state
  const standardUnitRefs = globalStandardUnitRefs;
  const loadingUnits = globalLoadingUnits;
  const hasApiData = globalHasApiData;

  const standardUnitsLoaded = computed(() => !loadingUnits.value && hasApiData.value);

  function getStandardUnitHowMany(item: StandardUnit) {
    // Use inline translation if available, otherwise fetch from API response
    if (item.inlineHowMany) {
      return translate(item.inlineHowMany);
    }

    const apiTranslation = standardUnitRefs.value[item.name]?.howMany;
    if (apiTranslation) {
      return translate(apiTranslation);
    }

    // Last resort: use the unit name
    return item.name;
  };

  function getStandardUnitEstimateIn(item: StandardUnit) {
    // Use inline translation if available, otherwise fetch from API response
    if (item.inlineEstimateIn) {
      return translate(item.inlineEstimateIn);
    }

    const apiTranslation = standardUnitRefs.value[item.name]?.estimateIn;
    if (apiTranslation) {
      return translate(apiTranslation);
    }

    // Last resort: use the unit name
    return item.name;
  };

  const buildFallbackRefs = (names: string[]): StandardUnitRefs => {
    return names.reduce<StandardUnitRefs>((acc, name) => {
      acc[name] = {
        estimateIn: { en: name },
        howMany: { en: name },
      };
      return acc;
    }, {});
  };

  async function resolveStandardUnits(names: string[]) {
    if (!names.length) {
      hasApiData.value = true; // No API call needed, so we're "loaded"
      return;
    }

    // Check if we already have the data for all requested names
    const missingNames = names.filter(name => !standardUnitRefs.value[name]);
    if (missingNames.length === 0) {
      hasApiData.value = true;
      return;
    }

    // Prevent concurrent API calls
    if (loadingUnits.value) {
      // Wait for the ongoing call to complete
      while (loadingUnits.value) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }

    loadingUnits.value = true;

    try {
      const { data } = await http.get<StandardUnitResponse[]>('portion-sizes/standard-units', {
        params: { id: missingNames },
      });

      const fetchedRefs = data.reduce<StandardUnitRefs>((acc, unit) => {
        const { id, estimateIn, howMany } = unit;
        acc[id] = { estimateIn, howMany };
        return acc;
      }, {});

      const fetchedIds = new Set(Object.keys(fetchedRefs));
      const fallbackRefs = buildFallbackRefs(
        missingNames.filter(name => !fetchedIds.has(name)),
      );

      standardUnitRefs.value = {
        ...standardUnitRefs.value,
        ...fetchedRefs,
        ...fallbackRefs,
      };

      if (fallbackRefs && Object.keys(fallbackRefs).length)
        console.warn('Missing standard unit definitions, using fallback labels:', fallbackRefs);

      hasApiData.value = true;
    }
    catch (error) {
      console.error('Failed to fetch standard units:', error);

      standardUnitRefs.value = {
        ...standardUnitRefs.value,
        ...buildFallbackRefs(missingNames),
      };

      hasApiData.value = true; // Even on error, allow the component to render
    }
    finally {
      loadingUnits.value = false;
    }
  };

  return {
    resolveStandardUnits,
    getStandardUnitHowMany,
    getStandardUnitEstimateIn,
    standardUnitRefs,
    standardUnitsLoaded,
  };
}
