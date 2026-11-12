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
import type { PropType } from 'vue';

import type { JobAttributes } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { useDownloadJob } from '@intake24/admin/components/jobs';
import { useResource } from '@intake24/admin/stores';

import ActionMixin from './action-mixin';

export default defineComponent({
  name: 'DownloadAction',

  mixins: [ActionMixin],

  props: {
    item: {
      type: Object as PropType<JobAttributes>,
      required: true,
    },
  },

  setup() {
    const resource = useResource();
    const { download, downloadUrlAvailable } = useDownloadJob((resource.module ?? resource.name).startsWith('user.'));

    return { download, downloadUrlAvailable };
  },
});
</script>

<style lang="scss" scoped></style>
