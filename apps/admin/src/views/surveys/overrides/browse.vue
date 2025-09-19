<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-card-title>{{ $t('survey-schemes.overrides.title') }}</v-card-title>
    <v-card-subtitle>
      {{ $t('survey-schemes.overrides.subtitle') }}
    </v-card-subtitle>
    <v-tabs v-model="tab" class="mt-4" grow>
      <v-tab v-for="item in ['settings', 'prompts', 'meals']" :key="item" :value="item">
        {{ $t(`survey-schemes.${item}.title`) }}
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="settings">
        <v-card>
          <v-card-title>{{ $t('survey-schemes.overrides.settings.title') }}</v-card-title>
          <v-card-text>
            <scheme-settings
              v-bind="{ errors, override: true }"
              v-model="data.surveySchemeOverrides.settings"
            />
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
      <v-tabs-window-item value="prompts">
        <v-expansion-panels v-model="panels" flat>
          <prompt-list
            v-bind="{ errors, mode: 'override', promptIds, templates: prompts }"
            v-model="data.surveySchemeOverrides.prompts"
          />
        </v-expansion-panels>
      </v-tabs-window-item>
      <v-tabs-window-item value="meals">
        <meal-list
          v-model="data.surveySchemeOverrides.meals"
          :errors="errors"
          mode="override"
          :scheme-id="entry.surveySchemeId"
        />
      </v-tabs-window-item>
    </v-tabs-window>
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { formMixin } from '@intake24/admin/components/entry';
import { MealList } from '@intake24/admin/components/lists';
import PromptList from '@intake24/admin/components/prompts/list/prompt-list.vue';
import { SchemeSettings } from '@intake24/admin/components/schemes';
import { useEntry, useEntryFetch, useEntryForm, useSelects } from '@intake24/admin/composables';
import type { SchemeOverrides } from '@intake24/common/surveys';
import { defaultOverrides, flattenScheme } from '@intake24/common/surveys';
import type { SurveyEntry } from '@intake24/common/types/http/admin';

export type SurveyOverridesForm = { surveySchemeOverrides: SchemeOverrides };

export default defineComponent({
  name: 'SurveySchemeOverrides',

  components: { MealList, PromptList, SchemeSettings },

  mixins: [formMixin],

  setup(props) {
    const { schemeTypes } = useSelects();
    const { entry, entryLoaded } = useEntry<SurveyEntry>(props);
    useEntryFetch(props);
    const {
      clearError,
      form: { data, errors },
      routeLeave,
      submit,
    } = useEntryForm<SurveyOverridesForm, SurveyEntry>(
      props,
      {
        data: { surveySchemeOverrides: defaultOverrides },
        editMethod: 'patch',
      },
    );

    const tab = ref('settings');

    const panels = ref(['override']);
    const promptIds = computed(() => data.value.surveySchemeOverrides.prompts.map(({ id }) => id));
    const prompts = computed(() => entryLoaded.value ? flattenScheme(entry.value.surveyScheme.prompts) : []);

    return {
      entry,
      entryLoaded,
      clearError,
      data,
      errors,
      panels,
      prompts,
      promptIds,
      routeLeave,
      schemeTypes,
      submit,
      tab,
    };
  },
});
</script>

<style lang="scss" scoped></style>
