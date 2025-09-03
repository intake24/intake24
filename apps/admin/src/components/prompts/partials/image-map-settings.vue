<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="$image-maps" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.imageMap._') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-select
        v-model="imageMap.labels"
        :items="labels"
        :label="$t('survey-schemes.prompts.imageMap.labels._')"
        prepend-inner-icon="fas fa-tag"
      />
      <v-switch
        v-model="imageMap.pinchZoom"
        hide-details="auto"
        :label="$t('survey-schemes.prompts.imageMap.pinchZoom')"
      />
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import type { ImageMap } from '@intake24/common/prompts';
import { useI18n } from '@intake24/i18n';

const props = defineProps({
  modelValue: {
    type: Object as PropType<ImageMap>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();
const imageMap = useVModel(props, 'modelValue', emit, { deep: true, passive: true });

const labels = [true, false, null].map(value => ({
  value,
  title: t(`survey-schemes.prompts.imageMap.labels.${value}`),
}));
</script>

<style lang="scss" scoped></style>
