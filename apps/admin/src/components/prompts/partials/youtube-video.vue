<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="fas fa-sliders" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.video.youtube._') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-container>
      <v-row class="mb-3">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="modelValue.videoId"
            class="mb-4"
            hide-details="auto"
            :label="$t('survey-schemes.prompts.video.youtube.videoId')"
            variant="outlined"
          />
          <v-text-field
            v-model.number="modelValue.height"
            class="mb-4"
            hide-details="auto"
            :label="$t('survey-schemes.prompts.video.youtube.height')"
            :rules="isNumber"
            variant="outlined"
          />
          <v-text-field
            v-model.number="modelValue.width"
            hide-details="auto"
            :label="$t('survey-schemes.prompts.video.youtube.width')"
            :rules="isNumber"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-switch
            v-model="modelValue.autoContinue"
            hide-details="auto"
            :label="$t('survey-schemes.prompts.video.youtube.autoContinue')"
          />
          <v-switch
            v-model="modelValue.autoplay"
            hide-details="auto"
            :label="$t('survey-schemes.prompts.video.youtube.autoplay')"
          />
          <v-switch
            v-model="modelValue.required"
            hide-details="auto"
            :label="$t('survey-schemes.prompts.video.youtube.required')"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { YoutubeVideo } from '@intake24/common/prompts';

import { useVModel } from '@vueuse/core';
import { computed } from 'vue';

defineOptions({ name: 'YoutubeVideo' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<YoutubeVideo>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const modelValue = useVModel(props, 'modelValue', emit, { deep: true, passive: true });

const isNumber = computed(() => [
  (value: string | null): boolean | string =>
    !Number.isNaN(value) || 'Value needs to be a number.',
]);
</script>

<style lang="scss" scoped></style>
