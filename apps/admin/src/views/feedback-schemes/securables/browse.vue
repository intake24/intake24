<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <securables :owner="entry.owner" :resource-id="id" securable-type="FeedbackScheme" />
  </layout>
</template>

<script lang="ts">
import type { FeedbackSchemeEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { Securables } from '@intake24/admin/components/securables';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'FeedbackSchemeSecurables',

  components: { Securables },

  mixins: [detailMixin],

  setup(props) {
    const { entry, entryLoaded } = useEntry<FeedbackSchemeEntry>(props);
    useEntryFetch(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
