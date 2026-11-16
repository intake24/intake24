<template>
  <v-sheet class="feedback-section">
    <h2 v-if="data.title" class="text-headline-large font-weight-medium text-center mb-6">
      {{ data.title }}
    </h2>
    <v-container v-if="section.content">
      <v-row class="justify-center">
        <v-col cols md="10">
          <div v-dompurify-html="data.content" class="px-4" />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FeedbackCustomSection } from '@intake24/common/feedback';

import { computed } from 'vue';

import { useI18n } from '@intake24/ui';

const props = defineProps({
  section: {
    type: Object as PropType<FeedbackCustomSection>,
    required: true,
  },
});

const { translate } = useI18n();

const data = computed(() => ({
  title: translate(props.section.title),
  content: translate(props.section.content),
}));
</script>

<style lang="scss"></style>
