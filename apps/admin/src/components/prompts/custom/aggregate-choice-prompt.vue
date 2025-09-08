<template>
  <v-tabs-window-item value="options">
    <language-selector
      border
      :default="[]"
      flat
      :label="$t('common.options.title')"
      :model-value="options"
      @update:model-value="update('options', $event)"
    >
      <template v-for="lang in Object.keys(options)" :key="lang" #[`lang.${lang}`]>
        <options-list
          :options="options[lang]"
          @update:options="updateLanguage('options', lang, $event)"
        />
      </template>
    </language-selector>
    <food-filter
      :model-value="foodFilter"
      prompt="aggregate-choice-prompt"
      @update:model-value="update('foodFilter', $event)"
    />
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { OptionsList } from '@intake24/admin/components/lists';
import type { Condition } from '@intake24/common/prompts';
import type { LocaleOptionList } from '@intake24/common/types';
import { FoodFilter, useBasePrompt } from '../partials';

const props = defineProps({
  options: {
    type: Object as PropType<LocaleOptionList>,
    required: true,
  },
  foodFilter: {
    type: Object as PropType<Condition>,
  },
});

const emit = defineEmits(['update:options']);

const { update, updateLanguage } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
