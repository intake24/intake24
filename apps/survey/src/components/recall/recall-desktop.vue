<template>
  <v-row class="justify-center" :no-gutters="$vuetify.display.mobile">
    <v-slide-x-transition mode="out-in">
      <v-col v-if="showMealList" cols="3">
        <meal-list v-bind="{ meals }" @action="action" />
      </v-col>
    </v-slide-x-transition>
    <v-col :cols="showMealList ? 8 : 9">
      <v-slide-y-transition hide-on-leave mode="out-in">
        <component
          :is="handlerComponent"
          v-if="currentPrompt && !hideCurrentPrompt"
          :key="handlerKey"
          :prompt="currentPrompt.prompt"
          :section="currentPrompt.section"
          @action="action"
        />
      </v-slide-y-transition>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import {
  customHandlers,
  portionSizeHandlers,
  standardHandlers,
} from '@intake24/survey/components/handlers';

import { MealList } from '../layouts';
import { useRecall } from './use-recall';

defineOptions({
  name: 'RecallDesktop',

  components: { MealList, ...customHandlers, ...standardHandlers, ...portionSizeHandlers },
});

const {
  currentPrompt,
  handlerComponent,
  handlerKey,
  hideCurrentPrompt,
  meals,
  showMealList,
  action,
} = useRecall();
</script>

<style lang="scss" scoped></style>
