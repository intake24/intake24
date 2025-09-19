<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <v-select
          class="mt-4"
          hide-details="auto"
          :items="videoItems"
          :label="$t('survey-schemes.prompts.video._')"
          :model-value="video ? video.type : undefined"
          variant="outlined"
          @update:model-value="updateVideo($event)"
        />
        <component
          :is="video.type"
          v-if="video"
          class="mt-4"
          :model-value="video"
          @update:model-value="update('video', $event)"
        />
      </v-col>
      <v-col :cols="12">
        <carousel
          :model-value="carousel"
          @update:model-value="update('carousel', $event)"
        />
      </v-col>
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { ytVideoDefaults } from '@intake24/common/prompts';
import type { Prompts } from '@intake24/common/prompts';
import { useI18n } from '@intake24/i18n';
import { Carousel, useBasePrompt, YoutubeVideo } from '../partials';

defineOptions({
  name: 'InfoPrompt',

  components: { youtube: YoutubeVideo },
});

const props = defineProps({
  carousel: {
    type: Object as PropType<Prompts['info-prompt']['carousel']>,
  },
  video: {
    type: [Boolean, Object] as PropType<Prompts['info-prompt']['video']>,
  },
});

const emit = defineEmits(['update:options']);

const { i18n } = useI18n();
const { update } = useBasePrompt(props, { emit });

const videoDefaults = {
  youtube: ytVideoDefaults,
};
const videoTypes = [undefined, 'youtube'] as const;
const videoItems = videoTypes.map(value => ({
  value,
  title: value ? i18n.t(`survey-schemes.prompts.video.${value}._`) : i18n.t('common.disabled'),
}));

function updateVideo(value: typeof videoTypes[number]) {
  update('video', typeof value === 'string' ? videoDefaults[value] : undefined);
}
</script>

<style lang="scss" scoped></style>
