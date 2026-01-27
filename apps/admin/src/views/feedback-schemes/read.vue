<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <template #actions>
      <copy-record-dialog
        v-if="canHandleEntry('copy')"
        :record-id="id"
        resource="feedback-schemes"
      />
      <preview :feedback-scheme="entry" :images="refs.images" />
    </template>
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('common.name') }}</th>
          <td>{{ entry.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('feedback-schemes.types._') }}</th>
          <td>{{ entry.type }}</td>
        </tr>
        <tr>
          <th>{{ $t('feedback-schemes.physicalDataFields.title') }}</th>
          <td>
            {{
              entry.physicalDataFields
                .map((field) => $t(`feedback-schemes.physicalDataFields.${field}`))
                .join(', ')
            }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('feedback-schemes.outputs.title') }}</th>
          <td>
            {{ entry.outputs.map((output) => $t(`feedback-schemes.outputs.${output}`)).join(', ') }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('securables.visibility._') }}</th>
          <td>{{ $t(`securables.visibility.${entry.visibility}`) }}</td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import type { FeedbackSchemeEntry, FeedbackSchemeRefs } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { CopyRecordDialog } from '@intake24/admin/components/dialogs';
import { detailMixin } from '@intake24/admin/components/entry';
import { Preview } from '@intake24/admin/components/feedback';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'FeedbackSchemeDetail',

  components: { CopyRecordDialog, Preview },

  mixins: [detailMixin],

  setup(props) {
    const { canHandleEntry, entry, entryLoaded, refs } = useEntry<FeedbackSchemeEntry, FeedbackSchemeRefs>(props);
    useEntryFetch(props);

    return { canHandleEntry, entry, entryLoaded, refs };
  },
});
</script>

<style lang="scss" scoped></style>
