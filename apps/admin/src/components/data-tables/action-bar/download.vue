<template>
  <v-btn
    v-if="downloadUrlAvailable(item)"
    :title="internalTitle"
    @click="download(item)"
  >
    <v-icon>
      {{ icon }}
    </v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { useDownloadJob } from '@intake24/admin/components/jobs';

import ActionMixin from './action-mixin';

export default defineComponent({
  name: 'DownloadAction',

  mixins: [ActionMixin],

  setup() {
    const { download, downloadUrlAvailable } = useDownloadJob();

    return { download, downloadUrlAvailable };
  },
});
</script>

<style lang="scss" scoped></style>
