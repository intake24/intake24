<template>
  <div>
    <v-card-title>{{ $t('jobs.params') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col v-if="!disabled.localeId" cols="12">
          <select-resource
            v-model="params.localeId"
            :error-messages="errors.get('params.localeId')"
            item-name="englishName"
            :label="$t('jobs.types.LocaleCopy.localeId')"
            name="localeId"
            resource="locales"
          />
        </v-col>
        <v-col cols="12">
          <select-resource
            v-model="params.sourceLocaleId"
            :disabled="disabled.sourceLocaleId"
            :error-messages="errors.get('params.sourceLocaleId')"
            item-name="englishName"
            :label="$t('jobs.types.LocaleCopy.sourceLocaleId')"
            name="sourceLocaleId"
            resource="locales"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="params.subTasks"
            :error-messages="errors.get('params.subTasks')"
            hide-details="auto"
            :items="subTasks"
            :label="$t('jobs.types.LocaleCopy.subTasks._')"
            multiple
            name="subTasks"
            prepend-inner-icon="fas fa-list"
            variant="outlined"
          >
            <template #selection="{ item, index }">
              <template v-if="index === 0">
                <span v-if="params.subTasks.length === 1">{{ item.raw.title }}</span>
                <span v-if="params.subTasks.length > 1">
                  {{ $t('common.selected', { count: params.subTasks.length }) }}
                </span>
              </template>
            </template>
          </v-select>
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { localeCopySubTasks } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';

import jobParams from './job-params';

export default defineComponent({
  name: 'LocaleCopy',

  components: { SelectResource },

  mixins: [jobParams<JobParams['LocaleCopy']>()],

  setup() {
    const { i18n } = useI18n();

    const subTasks = localeCopySubTasks.map(value => ({
      title: i18n.t(`jobs.types.LocaleCopy.subTasks.${value}`),
      value,
    }));

    return {
      subTasks,
    };
  },
});
</script>

<style scoped></style>
