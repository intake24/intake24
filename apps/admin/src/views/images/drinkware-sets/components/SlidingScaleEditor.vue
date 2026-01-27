<template>
  <v-card flat>
    <v-card-title>{{ $t('drinkware-sets.slidingScale.title') }}</v-card-title>
    <v-card-text>
      <!-- Legacy sliding scale version, cannot be edited unless converted to v2 -->
      <v-card v-if="scale.version !== 2" flat>
        <v-card-title>
          <v-icon class="mx-2">
            fas fa-exclamation-circle
          </v-icon>
          {{ $t('drinkware-sets.slidingScale.obsolete') }}
        </v-card-title>
        <v-card-text>
          <p v-html="$t('drinkware-sets.slidingScale.legacy.p1')" />
          <p v-html="$t('drinkware-sets.slidingScale.legacy.p2')" />
          <p v-html="$t('drinkware-sets.slidingScale.legacy.p3')" />
          <p v-html="$t('drinkware-sets.slidingScale.legacy.p4')" />
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" @click="onConvertScaleVersion">
            <v-icon class="mx-2">
              fas fa-rotate
            </v-icon>
            {{ $t('drinkware-sets.slidingScale.legacy.convert') }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="scale.version === 2" flat>
        <v-card-subtitle class="pa-0">
          <v-alert class="pa-2" color="#ddd" density="compact" icon="fas fa-info-circle">
            <span v-html="$t('drinkware-sets.slidingScale.editInstructions')" />
          </v-alert>
        </v-card-subtitle>
        <v-switch
          v-if="overlayImageUrl"
          v-model="showOverlayImage"
          density="compact"
          :label="$t('drinkware-sets.slidingScale.fillableAreaToggle')"
        />
        <v-card-actions class="wrap-actions">
          <v-btn :disabled="selectedVertexIndex === -1" @click="deleteSelected">
            <v-icon class="mr-2">
              fas fa-trash
            </v-icon>{{ $t('drinkware-sets.slidingScale.deleteSelected') }}
          </v-btn>
          <v-spacer />
          <v-dialog v-model="clearScaleDialog" width="500px">
            <template #activator="{ props }">
              <v-btn
                color="error"
                :disabled="outlineCoordinates.length === 0"
                v-bind="props"
              >
                <v-icon class="mr-2">
                  fas fa-x
                </v-icon>{{ $t('drinkware-sets.slidingScale.deleteAll') }}
              </v-btn>
            </template>
            <template #default>
              <v-card>
                <v-card-title class="h2 justify-center">
                  {{ $t('drinkware-sets.clearScaleDialog.title') }}
                </v-card-title>
                <v-card-text class="px-6 py-4 d-flex justify-center">
                  <div class="text-subtitle-1">
                    {{ $t('drinkware-sets.clearScaleDialog.msg') }}
                  </div>
                </v-card-text>
                <v-container class="pa-6">
                  <v-btn
                    block
                    class="mb-2"
                    color="warning"
                    size="large"
                    :title="$t('common.action.delete')"
                    @click="clearScale()"
                  >
                    {{ $t('common.action.delete') }}
                  </v-btn>
                  <v-btn
                    block
                    color="warning"
                    size="large"
                    :title="$t('common.action.cancel')"
                    variant="outlined"
                    @click="clearScaleDialog = false"
                  >
                    {{ $t('common.action.cancel') }}
                  </v-btn>
                </v-container>
              </v-card>
            </template>
          </v-dialog>
        </v-card-actions>

        <div class="sliding-scale">
          <v-img ref="img" :src="scale.baseImageUrl">
            <template #placeholder>
              <image-placeholder />
            </template>
          </v-img>
          <v-img
            v-if="showOverlayImage && overlayImageUrl"
            class="fill-area-image"
            :src="overlayImageUrl"
          >
            <template #placeholder>
              <image-placeholder />
            </template>
          </v-img>

          <svg
            @dblclick.stop="createVertex"
            @mouseleave="endVertexDrag"
            @mousemove="onScaleMouseMove"
            @mouseup="endVertexDrag"
          >
            <polygon class="sliding-scale-polygon" :points="svgPolygonPoints" />
            <!-- ESLint complains about key not coming from the v-for iterator" -->
            <!-- eslint-disable vue/valid-v-for -->
            <circle
              v-for="(vertex, index) in outlineCoordinates"
              :key="uniqueId()"
              class="sliding-scale-vertex"
              :class="{ selected: index === selectedVertexIndex }"
              :cx="vertex[0] * width"
              :cy="vertex[1] * height"
              r="8"
              @mousedown="onVertexMouseDown(index)"
            />
          </svg>
        </div>
      </v-card>
    </v-card-text>

    <v-expansion-panels v-if="scale.version === 2" flat>
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{ $t('drinkware-sets.slidingScale.replaceBaseImage') }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-file-input
            v-model="newBaseImageFile"
            hide-details="auto"
            :label="$t('image-maps.baseImage')"
            name="baseImage"
            prepend-icon=""
            prepend-inner-icon="fas fa-paperclip"
            variant="outlined"
          />
          <v-btn class="mt-4" :disabled="!newBaseImageFile" @click="replaceBaseImage">
            <v-icon class="mr-2">
              fas fa-rotate
            </v-icon>
            {{ $t('drinkware-sets.slidingScale.replaceButtonLabel') }}
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script lang="ts" setup>
import type { DrinkwareSetEntry } from '@intake24/common/types/http/admin';

import { useElementSize } from '@vueuse/core';
import { chunk, flatten, uniqueId } from 'lodash-es';
import { computed, onMounted, ref, toRef, useTemplateRef, watch } from 'vue';

import ImagePlaceholder from '@intake24/admin/components/util/ImagePlaceholder.vue';
import { useEntry as useStoreEntry } from '@intake24/admin/stores';

import { closestSegmentIndex, closestVertexIndex } from '../../math-helpers';

defineOptions({ name: 'SlidingScaleEditor' });

const props = defineProps({
  scaleIndex: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['baseImageChanged']);

const img = useTemplateRef('img');

// @ts-expect-error should allow vue instance?
const { height, width } = useElementSize(img);

const screenHeight = ref(0);
const screenWidth = ref(0);

function getScreenDimensions() {
  screenHeight.value = window.screen.height;
  screenWidth.value = window.screen.width;
}

const entryStore = useStoreEntry();

const clearScaleDialog = ref(false);

const entry = entryStore.getEntry as DrinkwareSetEntry;

const scaleIndex = toRef(props, 'scaleIndex');

const selectedVertexIndex = ref(-1);

const overlayImageUrl = ref<string | undefined>(undefined);

const newBaseImageFile = ref<File | undefined>(undefined);

const showOverlayImage = ref(true);

const scale = computed(() => {
  return entry.scales[scaleIndex.value];
});

const outlineCoordinates = ref<[number, number][]>(
  scale.value.version === 2
    ? (chunk(scale.value.outlineCoordinates, 2) as [number, number][])
    : [],
);

const svgPolygonPoints = computed(() => {
  return outlineCoordinates.value
    .map(([x, y]) => `${x * width.value}, ${y * height.value}`)
    .join(' ');
});

function onConvertScaleVersion() {
  const v1 = entry.scales[scaleIndex.value];

  if (v1.version !== 1) {
    console.warn(
      `Attempted to convert a scale of version ${v1.version}: can only convert version 1`,
    );
    return;
  }

  overlayImageUrl.value = v1.overlayImageUrl;

  entry.scales.splice(scaleIndex.value, 1, {
    version: 2,
    choiceId: v1.choiceId,
    label: v1.label,
    volumeMethod: 'lookUpTable',
    volumeSamples: v1.volumeSamples,
    volumeSamplesNormalised: v1.volumeSamples,
    baseImageUrl: v1.baseImageUrl,
    outlineCoordinates: [],
  });

  outlineCoordinates.value = [];
}

function createVertex(e: MouseEvent) {
  const p = [e.offsetX / width.value, e.offsetY / height.value] as [number, number];
  const coords = outlineCoordinates.value;
  const closestIndex = closestSegmentIndex(coords, p);
  const insertAt = (closestIndex + 1) % coords.length;
  coords.splice(insertAt, 0, p);
  selectedVertexIndex.value = insertAt;
}

function deleteSelected() {
  const coords = outlineCoordinates.value;
  const deletedPos = coords[selectedVertexIndex.value];
  coords.splice(selectedVertexIndex.value, 1);
  selectedVertexIndex.value = closestVertexIndex(coords, deletedPos);
}

function clearScale() {
  outlineCoordinates.value = [];
  clearScaleDialog.value = false;
  selectedVertexIndex.value = -1;
}

onMounted(() => {
  getScreenDimensions();
});

let dragging = false;

function onVertexMouseDown(index: number) {
  selectedVertexIndex.value = index;
  dragging = true;
}

function endVertexDrag() {
  dragging = false;
}

function onScaleMouseMove(e: MouseEvent) {
  if (dragging) {
    outlineCoordinates.value.splice(selectedVertexIndex.value, 1, [
      e.offsetX / width.value,
      e.offsetY / height.value,
    ]);
  }
}

function replaceBaseImage() {
  if (newBaseImageFile.value) {
    // revokeObjectURL seems to fail silently if the string is not a valid object URL
    // so there is no need to track allocated URLs separately
    URL.revokeObjectURL(scale.value.baseImageUrl);
    scale.value.baseImageUrl = URL.createObjectURL(newBaseImageFile.value);
    emit('baseImageChanged', scale.value.choiceId, newBaseImageFile.value);
  }
}

watch(
  outlineCoordinates,
  (newValue) => {
    if (scale.value.version === 2)
      scale.value.outlineCoordinates = flatten(newValue);
  },
  { deep: true },
);

watch(scale, (newValue) => {
  outlineCoordinates.value
    = newValue.version === 2 ? (chunk(newValue.outlineCoordinates, 2) as [number, number][]) : [];
});
</script>

<style lang="scss">
@use '@intake24/admin/scss/variables';

.wrap-actions {
  flex-wrap: wrap;
  justify-content: space-between;
  padding-left: 0;
}

.sliding-scale {
  position: relative;

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;

    .sliding-scale-polygon {
      stroke: black;
      stroke-width: 2px;
      fill: variables.$sliding_scale_color;
      fill-opacity: 0.4;
    }

    .sliding-scale-vertex {
      cursor: pointer;
      fill: black;
      fill-opacity: 0.5;
      stroke: black;
      stroke-width: 2px;

      &.selected {
        fill: variables.$primary;
      }
    }
  }
}

.fill-area-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}
</style>
