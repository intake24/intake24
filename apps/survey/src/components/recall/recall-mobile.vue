<template>
  <v-row class="justify-center pt-0" :no-gutters="$vuetify.display.mobile">
    <v-col class="pa-0" cols="12">
      <transition mode="out-in" name="component-fade">
        <component
          :is="handlerComponent"
          v-if="currentPrompt && !hideCurrentPrompt"
          :key="handlerKey"
          :prompt="currentPrompt.prompt"
          :section="currentPrompt.section"
          @action="action"
        />
      </transition>
    </v-col>
  </v-row>
  <food-add ref="foodAddRef" :meals @action="action" />
</template>

<script lang="ts" setup>
import {
  customHandlers,
  portionSizeHandlers,
  standardHandlers,
} from '@intake24/survey/components/handlers';

import { FoodAdd } from '../layouts';
import { useRecall } from './use-recall';

defineOptions({
  name: 'RecallMobile',

  components: { FoodAdd, ...customHandlers, ...standardHandlers, ...portionSizeHandlers },
});

const {
  currentPrompt,
  foodAddRef,
  handlerComponent,
  handlerKey,
  hideCurrentPrompt,
  meals,
  action,
} = useRecall();
</script>

<style lang="scss"></style>
