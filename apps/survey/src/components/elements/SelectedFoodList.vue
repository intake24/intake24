<template>
  <v-card
    v-for="(food, foodIndex) in step.foods"
    :key="foodIndex"
    class="mb-3"
    color="grey-lighten-4"
    flat
  >
    <v-card-text class="pa-2">
      <v-row align="center" justify="space-between" no-gutters>
        <v-col class="text-h6" cols="12" sm>
          <v-icon start>
            $food
          </v-icon>
          {{ step.foods[foodIndex].name }}
        </v-col>
        <v-col class="pt-2 pt-sm-0 d-flex flex-column ga-1" cols="12" sm="auto">
          <v-btn
            color="primary"
            :title="$t(`prompts.${type}.remove`)"
            variant="flat"
            @click="remove(index, foodIndex)"
          >
            <v-icon icon="$delete" start />
            {{ $t(`prompts.${type}.remove`) }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompt, RecipeBuilderStepState } from '@intake24/common/prompts';
import type { MealState } from '@intake24/common/surveys';

import { computed, defineComponent } from 'vue';

import { promptType } from '@intake24/ui';

export default defineComponent({
  name: 'SelectedFoodList',

  props: {
    step: {
      type: Object as PropType<RecipeBuilderStepState>,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
    meal: {
      type: Object as PropType<MealState>,
    },
    prompt: {
      type: Object as PropType<Prompt>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },

  emits: ['action', 'remove'],

  setup(props, { emit }) {
    const type = computed(() => promptType(props.prompt.component));

    const remove = (index: number, foodIndex: number) => {
      emit('remove', { index, foodIndex });
    };

    return { remove, type };
  },
});
</script>

<style scoped></style>
