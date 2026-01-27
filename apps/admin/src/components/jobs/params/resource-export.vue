<template>
  <div>
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-select
            v-model="params.resource"
            :error-messages="errors.get('params.resource')"
            hide-details="auto"
            :items="items"
            :label="$t('jobs.types.ResourceExport.resource')"
            name="resource"
            prepend-inner-icon="fas fa-list"
            variant="outlined"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { useUser } from '@intake24/admin/stores';
import { resources } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';

import jobParams from './job-params';

export default defineComponent({
  name: 'ResourceExport',

  mixins: [jobParams<JobParams['ResourceExport']>()],

  setup() {
    const { i18n } = useI18n();
    const { can } = useUser();

    const items = resources.filter(item => can(`${item.split('.')[0]}:browse`)).map(value => ({
      title: i18n.t(`${value}.title`),
      value,
    }));

    return {
      items,
    };
  },
});
</script>

<style scoped></style>
