<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.badges')"
          :model-value="badges"
          @update:model-value="update('badges', !!$event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          hide-details="auto"
          :items="orientations"
          :label="$t('survey-schemes.prompts.orientation._')"
          :model-value="orientation"
          variant="outlined"
          @update:model-value="update('orientation', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { useSelects } from '@intake24/admin/composables';

import { useBasePrompt } from '../partials';

defineOptions({ name: 'ParentFoodPortionPrompt' });

const props = defineProps({
  badges: {
    type: Boolean as PropType<Prompts['parent-food-portion-prompt']['badges']>,
    required: true,
  },
  orientation: {
    type: String as PropType<Prompts['parent-food-portion-prompt']['orientation']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
const { orientations } = useSelects();
</script>

<style lang="scss" scoped></style>
