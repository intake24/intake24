<template>
  <layout v-bind="{ id, entry }">
    <jobs
      v-bind="{
        id,
        resource: 'locales',
        alerts,
        defaultParams,
        refs,
        types,
      }"
    />
  </layout>
</template>

<script lang="ts">
import type { JobParams, LocaleJob } from '@intake24/common/types';
import type { LocaleEntry, LocaleRefs } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { Jobs } from '@intake24/admin/components/jobs';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import { localeCopySubTasks, localeJobs as types } from '@intake24/common/types';

export default defineComponent({
  name: 'LocaleTasks',

  components: { Jobs },

  mixins: [detailMixin],

  setup(props) {
    const { entry, refs } = useEntry<LocaleEntry, LocaleRefs>(props);
    useEntryFetch(props);

    const defaultParams = computed<Pick<JobParams, LocaleJob>>(() => ({
      LocaleCopy: { localeId: props.id, sourceLocaleId: '', subTasks: [...localeCopySubTasks] },
      LocaleCategories: { localeId: props.id },
      LocaleFoods: { localeId: props.id },
      LocaleFoodRankingUpload: { localeId: props.id, file: '', targetAlgorithm: 'fixed' },
      LocaleFoodNutrientMapping: { localeId: props.id },
    }));

    const alerts = {
      LocaleCopy: { type: 'error' as const, lines: 1 },
      LocaleFoodRankingUpload: { type: 'error' as const, lines: 3 },
    };

    return {
      alerts,
      defaultParams,
      entry,
      refs,
      types,
    };
  },
});
</script>

<style lang="scss" scoped></style>
