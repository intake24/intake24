<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <media media-model="FeedbackScheme" :resource-id="id" />
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { detailMixin } from '@intake24/admin/components/entry';
import { Media } from '@intake24/admin/components/media';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { FeedbackSchemeEntry } from '@intake24/common/types/http/admin';

export default defineComponent({
  name: 'FeedbackSchemeMedia',

  components: { Media },

  mixins: [detailMixin],

  setup(props) {
    const { entry, entryLoaded } = useEntry<FeedbackSchemeEntry>(props);
    useEntryFetch(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
