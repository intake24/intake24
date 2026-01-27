<template>
  <v-row>
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
    <v-col cols="12" md="6">
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
    <v-col class="d-flex flex-row align-center gc-2" cols="12">
      <v-switch
        hide-details="auto"
        :label="$t('survey-schemes.conditions.flag._')"
        :model-value="!!currentValue.flag"
        @update:model-value="updateEntity('flag', $event)"
      />
      <template v-if="currentValue.flag">
        <v-text-field
          v-model="currentValue.flag.id"
          hide-details="auto"
          :label="$t('survey-schemes.conditions.flag.id')"
          variant="outlined"
        />
        <v-checkbox-btn
          v-model="currentValue.flag.value"
          :label="$t('survey-schemes.conditions.flag.includeIfSet')"
        />
      </template>
    </v-col>
    <template v-if="currentValue.entity === 'food'">
      <v-col class="d-flex flex-row align-center gc-2" cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.conditions.tag._')"
          :model-value="!!currentValue.tag"
          @update:model-value="updateEntity('tag', $event)"
        />
        <template v-if="currentValue.tag">
          <v-text-field
            v-model="currentValue.tag.id"
            hide-details="auto"
            :label="$t('survey-schemes.conditions.tag.id')"
            variant="outlined"
          />
          <v-checkbox-btn
            v-model="currentValue.tag.value"
            :label="$t('survey-schemes.conditions.tag.includeIfSet')"
          />
        </template>
      </v-col>
      <v-col class="d-flex flex-row align-center gc-2" cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.conditions.category._')"
          :model-value="!!currentValue.category"
          @update:model-value="updateEntity('category', $event)"
        />
        <template v-if="currentValue.category">
          <select-resource
            v-model.trim="currentValue.category.id"
            item-id="code"
            :label="$t('survey-schemes.conditions.category.id')"
            resource="categories"
          >
            <template #title>
              {{ $t(`fdbs.categories.title`) }}
            </template>
            <template #item="{ item }">
              <v-list-item-title>{{ item.code }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
            </template>
          </select-resource>
          <v-checkbox-btn
            v-model="currentValue.category.value"
            :label="$t('survey-schemes.conditions.category.includeIfSet')"
          />
        </template>
      </v-col>
    </template>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { EntityValuePropertyCheck } from '@intake24/common/prompts';

import { VCombobox, VTextField } from 'vuetify/components';

import { SelectResource } from '@intake24/admin/components/dialogs';

import { useCheck } from './use-check';

defineOptions({
  components: { VTextField, VCombobox },
});

const props = defineProps({
  modelValue: {
    type: Object as PropType<EntityValuePropertyCheck>,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const { comboOps, conditionOps, currentValue } = useCheck(props, { emit });

function updateEntity(property: 'category' | 'tag' | 'flag', value: boolean | null) {
  if (currentValue.value.entity === 'food' || (currentValue.value.entity === 'meal' && property === 'flag')) {
    if (value) {
      currentValue.value[property] = { id: '', value: true };
    }
    else {
      delete currentValue.value[property];
    }
  }
}
</script>

<style lang="scss" scoped></style>
