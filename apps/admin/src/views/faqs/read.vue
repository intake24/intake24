<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <template #actions>
      <copy-record-dialog
        v-if="canHandleEntry('copy')"
        :record-id="id"
        resource="faqs"
      />
    </template>
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('common.name') }}</th>
          <td>{{ entry.name }}</td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { CopyRecordDialog } from '@intake24/admin/components/dialogs';
import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { FAQEntry } from '@intake24/common/types/http/admin';

export default defineComponent({
  name: 'FAQDetail',

  components: { CopyRecordDialog },

  mixins: [detailMixin],

  setup(props) {
    const { canHandleEntry, entry, entryLoaded, refs } = useEntry<FAQEntry>(props);
    useEntryFetch(props);

    return { canHandleEntry, entry, entryLoaded, refs };
  },
});
</script>

<style lang="scss" scoped></style>
