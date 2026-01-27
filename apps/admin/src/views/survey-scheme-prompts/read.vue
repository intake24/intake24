<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('survey-schemes.prompts.internal.id._') }}</th>
          <td>{{ entry.prompt.id }}</td>
        </tr>
        <tr>
          <th>{{ $t('survey-schemes.prompts.internal.name._') }}</th>
          <td>{{ entry.prompt.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('survey-schemes.prompts.component') }}</th>
          <td>{{ entry.prompt.component }}</td>
        </tr>
        <tr>
          <th>{{ $t('survey-schemes.prompts.type') }}</th>
          <td>{{ entry.prompt.type }}</td>
        </tr>
      </tbody>
    </v-table>
    <v-container fluid>
      <json-editor v-bind="{ readOnly: true, modelValue: entry.prompt }" />
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { SurveySchemePromptEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { JsonEditor } from '@intake24/admin/components/editors';
import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'SchemePromptDetail',

  components: { JsonEditor },

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<SurveySchemePromptEntry>(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
