<template>
  <v-card
    v-for="(food, index) in step.foods"
    :key="index"
    class="mb-3"
    color="grey-lighten-4"
    flat
  >
    <v-card-text class="pa-2">
      <v-row align="center" justify="space-between" no-gutters>
        <v-col class="text-h6" cols="12" sm>
          <v-icon icon="$food" start />
          {{ step.foods[index].name }}
        </v-col>
        <v-col class="pt-2 pt-sm-0 d-flex flex-column ga-1" cols="12" sm="auto">
          <v-btn
            color="primary"
            :title="$t(`prompts.${type}.remove`)"
            variant="flat"
            @click="remove(index)"
          >
            <v-icon icon="$delete" start />
            {{ $t(`prompts.${type}.remove`) }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FoodBuilderIngredientStepState, Prompt } from '@intake24/common/prompts';

import { computed } from 'vue';

import { promptType } from '@intake24/ui';

const props = defineProps({
  prompt: {
    type: Object as PropType<Prompt>,
    required: true,
  },
  step: {
    type: Object as PropType<FoodBuilderIngredientStepState>,
    required: true,
  },
});

const emit = defineEmits(['remove']);

const type = computed(() => promptType(props.prompt.component));

function remove(index: number) {
  emit('remove', index);
}
</script>

<style scoped></style>
