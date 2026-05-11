<template>
  <v-row class="pt-0" justify="center" :no-gutters="$vuetify.display.mobile">
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
</template>

<script lang="ts" setup>
import {
  customHandlers,
  portionSizeHandlers,
  standardHandlers,
} from '@intake24/survey/components/handlers';

import { useRecall } from './use-recall';

defineOptions({
  name: 'RecallMobile',

  components: { ...customHandlers, ...standardHandlers, ...portionSizeHandlers },
});

const {
  currentPrompt,
  handlerComponent,
  handlerKey,
  hideCurrentPrompt,
  action,
} = useRecall();
</script>

<style lang="scss"></style>
