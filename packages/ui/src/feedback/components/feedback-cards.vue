<template>
  <v-sheet class="feedback-section">
    <h2 class="text-h2 font-weight-medium text-center mb-6 chart-print-title">
      {{ $t('feedback.cards.title') }}
    </h2>
    <v-container class="container-max">
      <v-row class="d-print-none" justify="center">
        <v-col v-for="card in cards" :key="`screen-${card.id}`" cols="12" md="4" sm="6">
          <screen-card :parameters="card" />
        </v-col>
      </v-row>
      <div v-for="card in cards" :key="`print-${card.id}`" class="d-none d-print-block">
        <print-card :parameters="card" />
      </div>
    </v-container>
  </v-sheet>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FeedbackCardParameters } from '../cards-builder';

import { PrintCard, ScreenCard } from './cards';

defineProps({
  cards: {
    type: Array as PropType<FeedbackCardParameters[]>,
    required: true,
  },
});
</script>

<style lang="scss"></style>
