<template>
  <v-bottom-sheet v-model="dialog" persistent>
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }" />
    </template>
    <v-sheet class="text-center pa-3">
      <v-row dense no-gutter>
        <v-col cols="12">
          <pinch-scroll-zoom
            ref="zoomer"
            class="guide-drawer"
            :height="height * 0.6"
            :scale="scale"
            style="border: 1px solid grey"
            :width="width * 0.95"
          >
            <div v-if="label" class="label">
              <v-chip
                class="ma-1 ma-md-2 pa-3 pa-md-4 text-h6 font-weight-bold border-info-1"
                color="info"
              >
                {{ label }}
              </v-chip>
            </div>
            <img :src="imageMapData.baseImageUrl" :width="width">
            <svg v-bind="{ height, width }">
              <polygon
                v-for="(object, idx) in objects"
                :key="idx"
                class="guide-drawer-polygon"
                :class="{ active: idx === index }"
                :points="object.polygon"
                @click.stop="select(idx, object.id)"
                @keypress.stop="select(idx, object.id)"
              />
            </svg>
          </pinch-scroll-zoom>
        </v-col>
        <v-col cols="12">
          <v-btn :block="$vuetify.display.mobile" color="primary" @click="confirm">
            {{ $t('common.action.continue') }}
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-btn :block="$vuetify.display.mobile" color="primary" variant="text" @click="resetScale">
            {{ $t('common.action.reset') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-sheet>
  </v-bottom-sheet>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { ImageMapResponse } from '@intake24/common/types/http';

import PinchScrollZoom from '@coddicat/vue-pinch-scroll-zoom';
import { defineComponent, ref, toRef, useTemplateRef } from 'vue';

import { useImageMap } from './use-image-map';

export default defineComponent({
  name: 'PinchZoomImageMapSelector',

  components: { PinchScrollZoom },

  props: {
    id: {
      type: String,
    },
    index: {
      type: Number,
    },
    height: {
      type: Number,
      required: true,
    },
    imageMapData: {
      type: Object as PropType<ImageMapResponse>,
      required: true,
    },
    labels: {
      type: Object as PropType<{ image: string; objects: string[] }>,
      default: () => ({ image: '', objects: [] }),
    },
    width: {
      type: Number,
      required: true,
    },
  },

  emits: ['confirm', 'select'],

  setup(props, { emit }) {
    const dialog = ref(false);
    const zoomer = useTemplateRef<InstanceType<typeof PinchScrollZoom>>('zoomer');

    const { hoverIndex, label, objects } = useImageMap(props, toRef(props, 'width'));

    const resetScale = () => {
      // @ts-expect-error - not exposed in types
      zoomer.value?.setData({ scale: 1, originX: 0, originY: 0, translateX: 0, translateY: 0 });
    };

    const select = (idx: number, id: string) => {
      emit('select', idx, id);
    };

    const confirm = () => {
      dialog.value = false;
      emit('confirm');
    };

    return {
      confirm,
      dialog,
      hoverIndex,
      label,
      objects,
      resetScale,
      scale: 1,
      select,
      zoomer,
    };
  },
});
</script>

<style lang="scss" scoped></style>
