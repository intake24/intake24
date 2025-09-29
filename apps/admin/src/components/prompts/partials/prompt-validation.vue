<template>
  <v-tabs-window-item value="validation">
    <v-row>
      <v-col cols="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.validation.required')"
          :model-value="validation.required"
          name="validation.required"
          @update:model-value="update('required', $event)"
        />
        <language-selector
          border
          :label="$t('survey-schemes.prompts.validation.message')"
          :model-value="validation.message"
          :readonly="!validation.required"
          @update:model-value="update('message', $event)"
        >
          <template v-for="lang in Object.keys(validation.message)" :key="lang" #[`lang.${lang}`]>
            <v-text-field
              :disabled="!validation.required"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.validation.message')"
              :model-value="validation.message[lang]"
              variant="outlined"
              @update:model-value="updateLanguage('message', lang, $event)"
            />
          </template>
        </language-selector>
      </v-col>
      <v-col v-if="limits" cols="6">
        <div class="text-h5 mb-4">
          {{ $t('survey-schemes.prompts.validation.limits._') }}
        </div>
        <v-text-field
          class="mb-2"
          hide-details="auto"
          :label="$t('survey-schemes.prompts.validation.limits.min')"
          :model-value="validation.min"
          name="validation.min"
          variant="outlined"
          @update:model-value="update('min', toInteger($event))"
        />
        <v-text-field
          hide-details="auto"
          :label="$t('survey-schemes.prompts.validation.limits.max')"
          :model-value="validation.max"
          name="validation.max"
          variant="outlined"
          @update:model-value="update('max', toInteger($event))"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import { LanguageSelector } from '@intake24/admin/components/forms';
import type { PromptValidationWithLimits } from '@intake24/common/prompts';

export type LocaleTranslationKeys = 'message';

export default defineComponent({
  name: 'PromptValidation',

  components: { LanguageSelector },

  props: {
    limits: {
      type: Boolean,
    },
    validation: {
      type: Object as PropType<PromptValidationWithLimits>,
      required: true,
    },
  },

  emits: ['update:validation'],

  setup(props, { emit }) {
    const toInteger = (value: string): number | null => {
      const val = Number.parseInt(value);
      return Number.isNaN(val) ? null : val;
    };

    const update = (field: string, value: any) => {
      emit('update:validation', { ...props.validation, [field]: value });
    };
    const updateLanguage = (field: LocaleTranslationKeys, locale: string, value: any) => {
      emit('update:validation', { ...props.validation, [field]: { ...props.validation[field], [locale]: value } });
    };

    return { toInteger, update, updateLanguage };
  },
});
</script>

<style lang="scss" scoped></style>
