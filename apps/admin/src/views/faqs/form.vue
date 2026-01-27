<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <template #actions>
      <copy-record-dialog
        v-if="canHandleEntry('copy')"
        :record-id="id"
        resource="faqs"
      />
    </template>
    <v-form @keydown="clearError" @submit.prevent="submit">
      <v-container fluid>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('common.name')"
                name="name"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.visibility"
                :error-messages="errors.get('visibility')"
                hide-details="auto"
                :items="visibilities"
                :label="$t('securables.visibility._')"
                name="visibility"
                variant="outlined"
                @update:model-value="errors.clear('visibility')"
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props" :title="item.raw.title">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon" start />
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <v-icon :icon="item.raw.icon" start />
                  {{ item.raw.title }}
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-card-text>
      </v-container>
      <faq-sections v-model="data.content" :errors />
      <v-card-text>
        <submit-footer :disabled="errors.any.value" />
      </v-card-text>
    </v-form>
  </layout>
</template>

<script lang="ts">
import type { RecordVisibility } from '@intake24/common/security';
import type { FAQEntry, FAQSection } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { CopyRecordDialog } from '@intake24/admin/components/dialogs';
import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm, useSelects } from '@intake24/admin/composables';

import FaqSections from './sections.vue';

export type FAQForm = {
  id: string | null;
  name: string | null;
  content: FAQSection[];
  visibility: RecordVisibility;
};

export default defineComponent({
  name: 'SchemeForm',

  components: { CopyRecordDialog, FaqSections },

  mixins: [formMixin],

  setup(props) {
    const { visibilities } = useSelects();

    const { canHandleEntry, entry, entryLoaded, isCreate, refs } = useEntry<FAQEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<
      FAQForm,
      FAQEntry
    >(props, {
      data: {
        id: null,
        name: null,
        content: [],
        visibility: 'public',
      },
    });

    return {
      canHandleEntry,
      entry,
      entryLoaded,
      isCreate,
      clearError,
      data,
      errors,
      refs,
      routeLeave,
      submit,
      visibilities,
    };
  },
});
</script>

<style lang="scss" scoped></style>
