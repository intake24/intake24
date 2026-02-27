<template>
  <div class="d-flex flex-column ga-4">
    <v-select
      v-model="params.store"
      :error-messages="errors.get('params.store')"
      :items="stores"
      :label="$t('jobs.types.CleanRedisStore.stores._')"
      multiple
      name="store"
      variant="outlined"
    />
  </div>
</template>

<script lang="ts">
import type { JobParams } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { redisStoreTypes } from '@intake24/common/types';

import jobParams from './job-params';

export default defineComponent({
  name: 'CleanRedisStore',

  mixins: [jobParams<JobParams['CleanRedisStore']>()],

  data() {
    return {
      stores: redisStoreTypes.map(value => ({
        value,
        title: this.$t(`jobs.types.CleanRedisStore.stores.${value}`),
      })),
    };
  },
});
</script>

<style scoped></style>
