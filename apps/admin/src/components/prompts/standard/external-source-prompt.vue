<template>
  <v-tabs-window-item value="options">
    <v-card-text>
      <v-row>
        <v-col class="" cols="12" md="6">
          <v-select
            class="mb-4"
            :items="initialSearchOptions"
            :label="$t('survey-schemes.prompts.external-source-prompt.initialSearch._')"
            :model-value="initialSearch"
            @update:model-value="update('initialSearch', $event)"
          />
          <barcode-settings
            v-bind="{ barcode }"
            @update:barcode="update('barcode', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <external-source-settings
            v-bind="{ source }"
            @update:source="update('source', $event)"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Prompts } from '@intake24/common/prompts';
import { useI18n } from '@intake24/ui';
import { BarcodeSettings, ExternalSourceSettings, useBasePrompt } from '../partials';

const props = defineProps({
  barcode: {
    type: Object as PropType<Prompts['external-source-prompt']['barcode']>,
    required: true,
  },
  source: {
    type: Object as PropType<Prompts['external-source-prompt']['source']>,
    required: true,
  },
  initialSearch: {
    type: [Boolean, String] as PropType<Prompts['external-source-prompt']['initialSearch']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { i18n: { t } } = useI18n();
const { update } = useBasePrompt(props, { emit });

const initialSearchOptions = [false, 'searchTerm'].map(value => ({
  value,
  title: t(`survey-schemes.prompts.external-source-prompt.initialSearch.${value}`),
}));
</script>

<style lang="scss" scoped></style>
