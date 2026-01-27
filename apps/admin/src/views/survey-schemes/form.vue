<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <template #actions>
      <copy-record-dialog
        v-if="canHandleEntry('copy')"
        :record-id="id"
        resource="survey-schemes"
      />
    </template>
    <v-form @keydown="clearError" @submit.prevent="submit">
      <v-card-text>
        <v-container fluid>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                :label="$t('common.name')"
                name="name"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.visibility"
                class="mb-4"
                :error-messages="errors.get('visibility')"
                :items="visibilities"
                :label="$t('securables.visibility._')"
                name="visibility"
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
          <div class="text-subtitle-1 font-weight-medium py-4">
            {{ $t('survey-schemes.settings.title') }}
          </div>
          <scheme-settings v-bind="{ errors }" v-model="data.settings" />
        </v-container>
      </v-card-text>
      <v-divider />
      <meal-list v-model="data.meals" :errors="errors" :scheme-id="id" />
      <v-card-text>
        <submit-footer :disabled="errors.any.value" />
      </v-card-text>
    </v-form>
  </layout>
</template>

<script lang="ts">
import type { RecordVisibility } from '@intake24/common/security';
import type { ExportSection, Meal, RecallPrompts, SchemeSettings as SchemeSettingsType } from '@intake24/common/surveys';
import type { SurveySchemeEntry, SurveySchemeRefs } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { CopyRecordDialog } from '@intake24/admin/components/dialogs';
import { formMixin } from '@intake24/admin/components/entry';
import { MealList } from '@intake24/admin/components/lists';
import { SchemeSettings } from '@intake24/admin/components/schemes';
import { useEntry, useEntryFetch, useEntryForm, useSelects } from '@intake24/admin/composables';
import { defaultMeals, defaultSchemeSettings } from '@intake24/common/surveys';

export type SurveySchemeForm = {
  id: string | null;
  name: string | null;
  settings: SchemeSettingsType;
  prompts: RecallPrompts;
  meals: Meal[];
  dataExport: ExportSection[];
  visibility: RecordVisibility;
};

export type PatchSurveySchemeForm = Pick<
  SurveySchemeForm,
  'name' | 'settings' | 'meals' | 'visibility'
>;

export default defineComponent({
  name: 'SurveySchemeForm',

  components: { CopyRecordDialog, MealList, SchemeSettings },

  mixins: [formMixin],

  setup(props) {
    const { schemeTypes, visibilities } = useSelects();

    const { canHandleEntry, entry, entryLoaded, refs, refsLoaded } = useEntry<
      SurveySchemeEntry,
      SurveySchemeRefs
    >(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<
      PatchSurveySchemeForm,
      SurveySchemeEntry
    >(props, {
      data: {
        name: null,
        settings: defaultSchemeSettings,
        meals: defaultMeals,
        visibility: 'public',
      },
      editMethod: 'patch',
    });

    return {
      canHandleEntry,
      entry,
      entryLoaded,
      refs,
      refsLoaded,
      clearError,
      data,
      errors,
      routeLeave,
      schemeTypes,
      submit,
      visibilities,
    };
  },
});
</script>

<style lang="scss" scoped></style>
