<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="currentValue.tagId"
        hide-details="auto"
        :label="$t('survey-schemes.conditions.tag.id')"
        variant="outlined"
      />
    </v-col>
    <v-col align-self="center" cols="12" md="6">
      <v-checkbox-btn
        v-model="currentValue.value"
        :label="$t('survey-schemes.conditions.showIfSet')"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { TagPropertyCheck } from '@intake24/common/prompts';

import { useCheck } from './use-check';

const props = defineProps({
  modelValue: {
    type: Object as PropType<TagPropertyCheck>,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const { currentValue } = useCheck(props, { emit });
</script>

<style lang="scss" scoped></style>
