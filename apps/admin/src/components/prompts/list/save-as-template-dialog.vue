<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-list-item :disabled="disabled" link v-bind="props">
        <v-list-item-title>
          <v-icon :disabled="disabled" start>
            $save
          </v-icon>
          {{ $t('survey-schemes.prompts.templates.saveAs._') }}
        </v-list-item-title>
      </v-list-item>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="cancel" />
        <v-toolbar-title>
          {{ $t('survey-schemes.prompts.templates.saveAs.title') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-6 d-flex flex-column gr-4">
        <v-text-field
          v-model="data.prompt.id"
          disabled
          hide-details="auto"
          :label="$t('survey-schemes.prompts.internal.id._')"
          :messages="$t('survey-schemes.prompts.internal.id.hint')"
          name="id"
          variant="outlined"
        />
        <v-text-field
          v-model="data.prompt.name"
          disabled
          hide-details="auto"
          :label="$t('survey-schemes.prompts.internal.name._')"
          :messages="$t('survey-schemes.prompts.internal.name.hint')"
          name="name"
          variant="outlined"
        />
        <v-checkbox-btn v-model="redirect" :label="$t('common.redirect')" />
      </v-card-text>
      <error-list :errors="nonInputErrors" tag="v-card-text" />
      <v-card-actions class="pb-4">
        <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="cancel">
          <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn class="font-weight-bold" color="info" variant="text" @click.stop="confirm">
          <v-icon icon="$success" start />{{ $t('survey-schemes.prompts.templates.saveAs._') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

import { ErrorList } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { useEntry } from '@intake24/admin/stores';
import type { Prompt } from '@intake24/common/prompts';
import type { SurveySchemePromptEntry } from '@intake24/common/types/http/admin';
import { copy } from '@intake24/common/util';

export type SchemePromptForm = {
  prompt: Prompt;
};

export default defineComponent({
  name: 'SaveAsTemplateDialog',

  components: { ErrorList },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    prompt: {
      type: Object as PropType<Prompt>,
      required: true,
    },
  },

  setup(props) {
    const entry = useEntry();
    const router = useRouter();

    const { data, errors, post, nonInputErrors } = useForm<SchemePromptForm>({
      data: { prompt: props.prompt },
      nonInputErrorKeys: ['prompt'],
      config: { multipart: true },
    });

    const dialog = ref(false);
    const redirect = ref(false);

    function close() {
      dialog.value = false;
    };

    function cancel() {
      close();
    };

    async function confirm() {
      const { id, prompt } = await post<SurveySchemePromptEntry>('admin/survey-scheme-prompts');

      const templates = copy(entry.refs.templates);
      templates.push(prompt);

      entry.setRefs({ ...copy(entry.refs), templates });

      close();

      if (redirect.value)
        await router.push({ name: 'survey-scheme-prompts-read', params: { id } });
    };

    return {
      cancel,
      close,
      confirm,
      data,
      errors,
      dialog,
      nonInputErrors,
      redirect,
    };
  },
});
</script>
