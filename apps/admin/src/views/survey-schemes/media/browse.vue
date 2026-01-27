<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <media media-model="SurveyScheme" :resource-id="id" />
  </layout>
</template>

<script lang="ts">
import type { SurveySchemeEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { Media } from '@intake24/admin/components/media';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'SurveySchemeMedia',

  components: { Media },

  mixins: [detailMixin],

  setup(props) {
    const { entry, entryLoaded } = useEntry<SurveySchemeEntry>(props);
    useEntryFetch(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
