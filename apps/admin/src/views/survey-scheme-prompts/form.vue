<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.prompt.id"
                disabled
                hide-details="auto"
                :label="$t('survey-schemes.prompts.internal.id._')"
                :messages="$t('survey-schemes.prompts.internal.id.hint')"
                name="id"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.prompt.name"
                disabled
                hide-details="auto"
                :label="$t('survey-schemes.prompts.internal.name._')"
                :messages="$t('survey-schemes.prompts.internal.name.hint')"
                name="name"
                variant="outlined"
              />
            </v-col>
            <v-col align="center">
              <v-btn class="pa-6" color="secondary" size="x-large" variant="outlined" @click="edit">
                <v-icon icon="$edit" start />{{ $t('survey-scheme-prompts.editTemplate') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <error-list :errors="nonInputErrors" tag="v-card-text" />
        <v-card-text>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
      <prompt-selector ref="selector" :prompt-ids="promptIds" @save="save" />
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { Prompt } from '@intake24/common/prompts';
import type {
  SurveySchemePromptEntry,
  SurveySchemePromptRefs,
} from '@intake24/common/types/http/admin';

import { computed, defineComponent, ref } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import PromptSelector from '@intake24/admin/components/prompts/prompt-selector.vue';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { infoPrompt } from '@intake24/common/prompts';

export type SchemePromptForm = {
  id: string | null;
  name: string | null;
  promptId: string | null;
  prompt: Prompt;
};

export default defineComponent({
  name: 'SchemePromptForm',

  components: { PromptSelector },

  mixins: [formMixin],

  setup(props) {
    const { actions, ...prompt } = infoPrompt;

    const { entry, entryLoaded, refs, refsLoaded } = useEntry<
      SurveySchemePromptEntry,
      SurveySchemePromptRefs
    >(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, nonInputErrors, routeLeave, submit } = useEntryForm<
      SchemePromptForm,
      SurveySchemePromptEntry
    >(props, {
      data: {
        id: null,
        name: null,
        promptId: null,
        prompt,
      },
      nonInputErrorKeys: ['prompt'],
    });

    const selector = ref<InstanceType<typeof PromptSelector>>();

    const promptIds = computed(() => refs.value.promptIds);

    function edit() {
      selector.value?.edit(0, data.value.prompt, errors.get('prompt*'));
    };

    function save({ prompt }: { prompt: Prompt; index: number }) {
      errors.clear('prompt');

      data.value.prompt = prompt;
    };

    return {
      edit,
      entry,
      entryLoaded,
      refs,
      refsLoaded,
      promptIds,
      selector,
      clearError,
      data,
      errors,
      nonInputErrors,
      routeLeave,
      save,
      submit,
    };
  },
});
</script>

<style lang="scss" scoped></style>
