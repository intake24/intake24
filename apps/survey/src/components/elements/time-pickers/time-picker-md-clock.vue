<template>
  <v-time-picker
    v-model="state"
    :allowed-minutes="allowedMinutes"
    :ampm-in-title="prompt.amPmToggle"
    class="time-picker pa-0 mx-auto"
    :format="prompt.format"
    :landscape="$vuetify.display.smAndUp"
  />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { computed } from 'vue';

const props = defineProps({
  prompt: {
    type: Object as PropType<Prompts['meal-time-prompt' | 'time-picker-prompt']>,
    required: true,
  },
});

const state = defineModel('modelValue', { type: String as PropType<string | null>, default: null });

const allowedMinutes = computed(
  () => (minutes: number) => minutes % props.prompt.allowedMinutes === 0,
);
</script>

<style lang="scss">
.time-picker {
  .v-picker-title {
    display: none;
  }

  .v-time-picker-controls {
    margin-bottom: 16px;
  }

  // Vuetify landscape is broken
  .v-picker--landscape {
    grid-template-areas: 'header body';
    width: unset !important;

    .v-picker__header {
      height: 100%;

      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .v-time-picker-controls__ampm__btn {
    border: unset !important;
  }
}
</style>
