<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t(`survey-schemes.prompts.title`) }}
      </v-toolbar-title>
      <v-spacer />
      <options-menu>
        <select-resource resource="survey-schemes" return-object="prompts" @update:model-value="load">
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('survey-schemes.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="data.prompts" />
      </options-menu>
    </v-toolbar>
    <v-expansion-panels
      v-model="panels"
      flat
      multiple
    >
      <prompt-list
        v-for="(section, index) in promptSections"
        :key="section"
        v-bind="{
          errors,
          section,
          step: index + 1,
          promptIds,
          templates,
          modelValue: isMealSection(section) ? data.prompts.meals[section] : data.prompts[section],
        }"
        @move="move"
        @update:model-value="updateItems(section, $event)"
      />
    </v-expansion-panels>
  </layout>
</template>

<script lang="ts">
import type { SurveySchemeForm } from '../form.vue';
import type { PromptMoveEvent } from '@intake24/admin/components/prompts/list/prompt-list.vue';
import type { SinglePrompt } from '@intake24/common/prompts';
import type { PromptSection, RecallPrompts } from '@intake24/common/surveys';
import type { SurveySchemeEntry, SurveySchemeRefs } from '@intake24/common/types/http/admin';

import { defineComponent, ref } from 'vue';

import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { formMixin } from '@intake24/admin/components/entry';
import { promptSections } from '@intake24/admin/components/prompts';
import PromptList from '@intake24/admin/components/prompts/list/prompt-list.vue';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { defaultPrompts, flattenScheme, isMealSection } from '@intake24/common/surveys';

export type SurveySchemePromptsForm = Pick<SurveySchemeForm, 'prompts'>;

export default defineComponent({
  name: 'SurveySchemePrompts',

  components: { JsonEditorDialog, OptionsMenu, PromptList, SelectResource },

  mixins: [formMixin],

  setup(props) {
    const loadCallback = (data: SurveySchemeEntry) => {
      const { prompts, ...rest } = data;
      return { ...rest, prompts: { ...defaultPrompts, ...prompts } };
    };

    const { entry, entryLoaded, refs, refsLoaded } = useEntry<SurveySchemeEntry, SurveySchemeRefs>(
      props,
    );
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<
      SurveySchemePromptsForm,
      SurveySchemeEntry
    >(props, {
      data: { prompts: defaultPrompts },
      editMethod: 'patch',
      loadCallback,
    });

    const panels = ref([...promptSections]);

    return {
      promptSections,
      entry,
      entryLoaded,
      errors,
      refs,
      refsLoaded,
      clearError,
      data,
      panels,
      routeLeave,
      submit,
    };
  },

  computed: {
    promptIds(): string[] {
      return flattenScheme(this.data.prompts).map(({ id }) => id);
    },
    templates(): SinglePrompt[] {
      if (!this.refsLoaded)
        return [];

      return this.refs.templates.filter(template => this.promptIds.includes(template.id));
    },
  },

  methods: {
    isMealSection,

    load(prompts: RecallPrompts) {
      this.data.prompts = { ...prompts };
    },

    move(event: PromptMoveEvent) {
      const { section, prompt } = event;

      if (isMealSection(section)) {
        this.data.prompts.meals[section].push(prompt);
        return;
      }

      this.data.prompts[section].push(prompt);
    },

    updateItems(section: PromptSection, prompts: SinglePrompt[]) {
      if (isMealSection(section)) {
        this.data.prompts.meals[section] = prompts;
        return;
      }

      this.data.prompts[section] = prompts;
    },
  },
});
</script>

<style lang="scss" scoped></style>
