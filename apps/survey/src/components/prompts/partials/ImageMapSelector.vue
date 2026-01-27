<template>
  <v-row>
    <v-col cols="12">
      <v-alert v-if="labels.image" class="mb-2 text-body-2" color="info" variant="tonal">
        {{ labels.image }}
      </v-alert>
      <div class="guide-drawer">
        <v-img ref="img" rounded :src="imageMapData.baseImageUrl">
          <template #placeholder>
            <image-placeholder />
          </template>
        </v-img>
        <div class="pinch-zoom-activator">
          <pinch-zoom-image-map-selector
            v-if="config.pinchZoom && $vuetify.display.mobile"
            v-bind="{
              id,
              index,
              imageMapData,
              labels,
              height: screenHeight,
              width: screenWidth,
            }"
            @confirm="confirm"
            @select="select"
          >
            <template #activator="{ props }">
              <v-btn
                class="ma-1 font-weight-medium"
                color="grey-darken-3"
                icon
                :title="$t(`prompts.guideImage.expand`)"
                variant="text"
                v-bind="props"
              >
                <v-icon aria-hidden="false" :aria-label="$t(`prompts.guideImage.expand`)">
                  $expandImage
                </v-icon>
              </v-btn>
            </template>
          </pinch-zoom-image-map-selector>
        </div>
        <div class="label">
          <slot name="label">
            <v-chip
              v-if="label"
              class="ma-1 ma-md-2 pa-3 pa-md-4 text-h6 font-weight-bold border-info-1"
              color="info"
            >
              {{ label }}
            </v-chip>
          </slot>
        </div>
        <svg ref="svg">
          <filter id="polygon-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
          <polygon
            v-for="(object, idx) in objects"
            :key="idx"
            class="guide-drawer-polygon"
            :class="{ active: idx === index }"
            :points="object.polygon"
            @click.stop="select(idx, object.id)"
            @keypress.stop="select(idx, object.id)"
            @mouseleave="hoverIndex = undefined"
            @mouseover="hoverIndex = idx"
          />
        </svg>
      </div>
    </v-col>
    <v-col v-if="$vuetify.display.mobile" cols="12" sm="auto">
      <v-btn :block="$vuetify.display.mobile" color="primary" :disabled="isDisabled" @click="confirm">
        {{ $t('common.action.continue') }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { ImageMap } from '@intake24/common/prompts';
import type { ImageMapResponse } from '@intake24/common/types/http';

import { useElementSize } from '@vueuse/core';
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { useDisplay } from 'vuetify';

import { ImagePlaceholder } from '@intake24/survey/components/elements';

import PinchZoomImageMapSelector from './PinchZoomImageMapSelector.vue';
import { useImageMap } from './use-image-map';

defineOptions({ name: 'ImageMapSelector' });

const props = defineProps({
  config: {
    type: Object as PropType<ImageMap>,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: undefined,
  },
  id: {
    type: String,
  },
  index: {
    type: Number,
  },
  imageMapData: {
    type: Object as PropType<ImageMapResponse>,
    required: true,
  },
  labels: {
    type: Object as PropType<{ image: string; objects: string[] }>,
    default: () => ({ image: '', objects: [] }),
  },
});

const emit = defineEmits(['confirm', 'select']);

const img = useTemplateRef('img');
const svg = useTemplateRef('svg');

const display = useDisplay();

// @ts-expect-error should allow vue instance?
const { width } = useElementSize(img);

const screenHeight = ref(0);
const screenWidth = ref(0);

const { hoverIndex, label, objects } = useImageMap(props, width);

const isDisabled = computed(() =>
  typeof props.disabled === 'undefined' ? props.index === undefined : props.disabled,
);

function getScreenDimensions() {
  screenHeight.value = window.screen.height;
  screenWidth.value = window.screen.width;
}

function confirm() {
  emit('confirm');
}

function select(idx: number, id: string) {
  emit('select', idx, id);

  if (!display.mobile.value)
    confirm();
};

onMounted(() => {
  getScreenDimensions();
});
</script>

<style lang="scss">
@use '@intake24/survey/scss/variables';

.guide-drawer {
  position: relative;

  .label {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 2;
  }

  .pinch-zoom-activator {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
  }

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;

    .guide-drawer-polygon {
      cursor: pointer;
      fill: transparent;

      &.active {
        stroke-width: 8;
        stroke: variables.$primary;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: url(#polygon-blur);
      }

      &:hover {
        stroke-width: 8;
        stroke: variables.$info;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: url(#polygon-blur);
      }
    }
  }
}
</style>
