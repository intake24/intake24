<template>
  <v-tabs-window-item :key="type">
    <v-container fluid>
      <v-alert v-if="prompts.length === 0" color="secondary" type="info">
        {{ $t(`survey-schemes.prompts.${type}.noPrompts`) }}
      </v-alert>
      <v-row v-else>
        <v-col v-for="prompt in prompts" :key="prompt.id" cols="12" md="3">
          <v-item v-slot="{ isSelected, toggle }" :value="prompt.component">
            <v-card
              :color="isSelected ? 'primary' : 'secondary'"
              dark
              height="180"
              @click.stop="tryToggle(isSelected, toggle)"
            >
              <v-card-title class="text-center">
                {{ $t(`survey-schemes.prompts.${prompt.id}.title`) }}
              </v-card-title>
              <v-card-subtitle class="text-center">
                {{ $t(`survey-schemes.prompts.${prompt.id}.subtitle`) }}
              </v-card-subtitle>
              <v-card-text v-show="isSelected" class="text-center">
                <v-icon size="48">
                  $check
                </v-icon>
              </v-card-text>
            </v-card>
          </v-item>
        </v-col>
      </v-row>
    </v-container>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompt, PromptType } from '@intake24/common/prompts';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PromptTypeSelector',

  props: {
    type: {
      type: String as PropType<PromptType>,
      required: true,
    },
    prompts: {
      type: Array as PropType<Prompt[]>,
      default: () => [],
    },
  },

  methods: {
    tryToggle(active?: boolean, toggle?: () => void) {
      if (active)
        return;

      toggle?.();
    },
  },
});
</script>
