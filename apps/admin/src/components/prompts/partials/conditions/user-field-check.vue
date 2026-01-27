<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-combobox
        v-model="currentValue.field"
        closable-chips
        hide-details="auto"
        :items="standardUserFields"
        :label="$t('survey-schemes.conditions.userField.field')"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-select
        v-model="currentValue.op"
        hide-details="auto"
        item-value="op"
        :items="conditionOps"
        :label="$t('survey-schemes.conditions.ops._')"
        variant="outlined"
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
    <v-col cols="12">
      <component
        :is="comboOps.includes(currentValue.op) ? 'v-combobox' : 'v-text-field'"
        v-model="currentValue.value"
        chips
        deletable-chips
        hide-details="auto"
        :label="$t('survey-schemes.conditions.value')"
        multiple
        outlined
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { UserFieldPropertyCheck } from '@intake24/common/prompts';

import { VCombobox, VTextField } from 'vuetify/components';

import { standardUserFields } from '@intake24/common/prompts';

import { useCheck } from './use-check';

defineOptions({
  components: { VTextField, VCombobox },
});

const props = defineProps({
  modelValue: {
    type: Object as PropType<UserFieldPropertyCheck>,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const { comboOps, conditionOps, currentValue } = useCheck(props, { emit });
</script>

<style lang="scss" scoped></style>
