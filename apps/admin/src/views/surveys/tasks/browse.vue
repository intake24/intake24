<template>
  <layout v-bind="{ id, entry }">
    <jobs
      v-bind="{
        id,
        resource: 'surveys',
        alerts,
        defaultParams,
        types,
      }"
    />
  </layout>
</template>

<script lang="ts">
import type { JobParams, SurveyJob } from '@intake24/common/types';
import type { SurveyEntry } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { Jobs } from '@intake24/admin/components/jobs';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import { surveyJobs as types } from '@intake24/common/types';

export default defineComponent({
  name: 'SurveyTasks',

  components: { Jobs },

  mixins: [detailMixin],

  setup(props) {
    const { entry, entryLoaded } = useEntry<SurveyEntry>(props);
    useEntryFetch(props);

    const defaultParams = computed<Pick<JobParams, SurveyJob>>(() => ({
      SurveyAuthUrlsExport: { surveyId: props.id },
      SurveyDataExport: {
        surveyId: props.id,
        startDate: entry.value.startDate,
        endDate: entry.value.endDate,
      },
      SurveyNutrientsRecalculation: { surveyId: props.id },
      SurveyRatingsExport: { surveyId: props.id },
      SurveyRespondentsImport: { surveyId: props.id, file: '' },
      SurveySessionsExport: { surveyId: props.id },
    }));

    const alerts = {
      SurveyNutrientsRecalculation: { type: 'warning' as const, lines: 2 },
    };

    return {
      alerts,
      defaultParams,
      entry,
      entryLoaded,
      types,
    };
  },
});
</script>

<style lang="scss" scoped></style>
