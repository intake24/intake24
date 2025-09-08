<template>
  <v-tabs-window-item value="options">
    <v-container>
      <v-row class="ml-2" dense>
        <v-col cols="12" md="6">
          <v-switch
            hide-details="auto"
            :label="$t('survey-schemes.prompts.food-selection-prompt.useFlag')"
            :model-value="useFlag"
            @update:model-value="update('useFlag', $event)"
          />
        </v-col>
      </v-row>
      <v-expand-transition>
        <v-row v-show="useFlag" class="ml-2" dense>
          <v-col cols="12" md="6">
            <v-text-field
              :label="$t('survey-schemes.prompts.food-selection-prompt.flag')"
              :model-value="flag"
              @update:model-value="update('flag', $event)"
            />
          </v-col>
        </v-row>
      </v-expand-transition>
      <food-filter
        :model-value="foodFilter"
        prompt="food-selection-prompt"
        @update:model-value="update('foodFilter', $event)"
      />
    </v-container>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Condition } from '@intake24/common/prompts';
import { FoodFilter, useBasePrompt } from '../partials';

const props = defineProps({
  foodFilter: {
    type: Object as PropType<Condition>,
  },
  useFlag: {
    type: Boolean,
  },
  flag: {
    type: String,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });
</script>

<style lang="scss" scoped></style>
