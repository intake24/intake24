<template>
  <div class="guides-drawer">
    <v-img ref="img" rounded :src="entry.baseImageUrl" />
    <svg
      ref="svg"
      :style="svgCursor"
      @dblclick.stop="isGuideImage || readonly ? undefined : addNode($event)"
    >
      <g v-for="(object, objectIdx) in scaled" :key="objectIdx" class="guides-drawer-group">
        <polygon
          class="guides-drawer-polygon"
          :class="{ active: objectIdx === selectedObjectIdx }"
          :points="object.polygon"
          @click.stop="selectObject(objectIdx)"
          @keypress.stop="selectObject(objectIdx)"
        />
        <g v-if="isImageMap && !readonly" class="guides-drawer-node-group">
          <circle
            v-for="([x, y], nodeIdx) in object.coords"
            :key="nodeIdx"
            class="guides-drawer-node"
            :cx="x"
            :cy="y"
            :style="nodeCursor"
            @dblclick.stop="removeNode(nodeIdx)"
            @mousedown="dragNode($event, nodeIdx)"
            @mouseup="dropNode()"
          />
        </g>
      </g>
    </svg>
    <v-item-group v-model="selectedObjectIdx">
      <v-container fluid>
        <v-row>
          <v-col v-for="(object, idx) in objects" :key="object.id" cols="12" lg="4" sm="6">
            <v-item v-slot="{ isSelected }">
              <v-card border flat min-height="200px">
                <v-toolbar
                  :color="isSelected ? `primary` : `ternary`"
                  :dark="isSelected"
                  flat
                  :style="{ cursor: 'pointer' }"
                  @click="selectObject(idx)"
                >
                  <v-icon icon="fas fa-draw-polygon" start />{{ $t(`${resource}.objects.id`) }}:
                  {{ object.id }}
                  <v-spacer />
                  <confirm-dialog
                    v-if="isImageMap && !readonly"
                    color="error"
                    icon
                    :icon-color="isSelected ? `white` : `error`"
                    icon-left="$delete"
                    :label="$t(`${resource}.objects.delete`)"
                    variant="text"
                    @confirm="removeObject(idx)"
                  >
                    {{ $t('common.action.confirm.delete', { name: entry.id }) }}
                  </confirm-dialog>
                </v-toolbar>
                <v-divider />
                <v-card-text class="d-flex flex-column gr-4">
                  <v-text-field
                    v-model.trim="object.description"
                    :label="$t('common.description')"
                    :name="`description-${object.id}`"
                    :readonly="isGuideImage || readonly"
                  />
                  <v-text-field
                    v-if="isGuideImage"
                    v-model.number="object.weight"
                    :label="$t(`${resource}.objects.weight`)"
                    :name="`weight-${object.id}`"
                    prepend-inner-icon="fas fa-scale-balanced"
                    :readonly="isImageMap || readonly"
                  />
                  <language-selector
                    v-model="object.label"
                    border
                    :label="$t(`${resource}.objects.label._`)"
                    :readonly
                  >
                    <template v-for="lang in Object.keys(object.label)" :key="lang" #[`lang.${lang}`]>
                      <v-text-field
                        v-model="object.label[lang]"
                        :hint="isGuideImage ? $t(`${resource}.objects.label.hint`) : undefined"
                        :label="$t(`${resource}.objects.label._`)"
                        :persistent-hint="isGuideImage"
                        @update:model-value="updateObjects"
                      />
                    </template>
                  </language-selector>
                </v-card-text>
              </v-card>
            </v-item>
          </v-col>
          <v-col v-if="isImageMap && !readonly" cols="12" lg="4" sm="6">
            <v-card
              border
              class="d-flex justify-center align-center"
              flat
              height="100%"
              link
              min-height="200px"
              :title="$t(`${resource}.objects.add`)"
              @click.stop="addObject"
            >
              <v-btn color="primary" icon="$add" size="x-large" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-item-group>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useElementSize, watchDebounced } from '@vueuse/core';
import chunk from 'lodash/chunk';
import debounce from 'lodash/debounce';
import { computed, ref, useTemplateRef } from 'vue';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { closestSegmentIndex } from '@intake24/admin/views/images/math-helpers';
import type {
  GuideImageEntry,
  GuideImageEntryObject,
  ImageMapEntry,
  ImageMapEntryObject,
} from '@intake24/common/types/http/admin';
import { ConfirmDialog } from '@intake24/ui';

interface Objects extends Omit<GuideImageEntryObject, 'id' | 'outlineCoordinates'> {
  id: number;
}

type PathCoords = number[][][];

defineOptions({ name: 'GuideDrawer' });

const props = defineProps({
  entry: {
    type: Object as PropType<GuideImageEntry | ImageMapEntry>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  resource: {
    type: String as PropType<'image-maps' | 'guide-images'>,
    required: true,
  },
});

const emit = defineEmits(['imageMapObjects', 'guideImageObjects']);

/* function distance([sourceX, sourceY]: number[], [targetX, targetY]: number[]) {
  return Math.sqrt((sourceX - targetX) ** 2 + (sourceY - targetY) ** 2);
} */

const img = useTemplateRef('img');
const svg = useTemplateRef('svg');

// @ts-expect-error should allow vue instance?
const { width } = useElementSize(img);

const objects = ref<Objects[]>([]);
const coords = ref<PathCoords>([]);

const selectedObjectIdx = ref<number | null>(null);
const selectedNodeIdx = ref<number | null>(null);

props.entry.objects.forEach(({ id, outlineCoordinates, ...rest }) => {
  coords.value.push(chunk(outlineCoordinates, 2));
  objects.value.push({ weight: 0, id: Number.parseInt(id, 10), ...rest });
});

const isImageMap = computed(() => props.resource === 'image-maps');
const isGuideImage = computed(() => props.resource === 'guide-images');

const svgCursor = computed(
  () => `cursor: ${props.readonly || selectedObjectIdx.value === null ? 'no-drop' : 'pointer'}`,
);

const nodeCursor = computed(
  () => `cursor: ${selectedNodeIdx.value === null ? 'grab' : 'grabbing'}`,
);

const scaled = computed(() => {
  return coords.value.map((node) => {
    const coords = node.map(([x, y]) => [x * width.value, y * width.value]);
    const polygon = coords.map(scaledNode => scaledNode.join(',')).join(' ');

    return { coords, polygon };
  });
});

const imageMapObjects = computed<ImageMapEntryObject[]>(() =>
  objects.value.map(({ id, weight, ...rest }, index) => ({
    ...rest,
    id: id.toString(),
    outlineCoordinates: coords.value[index].flat(),
  })),
);

const guideImageObjects = computed<GuideImageEntryObject[]>(() =>
  objects.value.map(({ id, ...rest }, index) => ({
    ...rest,
    id: id.toString(),
    outlineCoordinates: coords.value[index].flat(),
  })),
);

function updateImageMapObjects() {
  emit('imageMapObjects', imageMapObjects.value);
}

function updateGuideImageObjects() {
  emit('guideImageObjects', guideImageObjects.value);
}

const updateObjects = debounce(() => {
  updateImageMapObjects();
  updateGuideImageObjects();
}, 500);

function selectObject(idx: number) {
  selectedObjectIdx.value = idx;
};

function addObject() {
  const nextId = objects.value.reduce((acc, { id }) => (acc < id ? id : acc), -1);
  coords.value.push([]);
  const objectsLength = objects.value.push({
    id: nextId + 1,
    description: '',
    label: {},
    navigationIndex: nextId + 1,
    weight: 0,
  });
  selectObject(objectsLength - 1);
};

function removeObject(index: number) {
  coords.value.splice(index, 1);
  objects.value.splice(index, 1);
};

/* function getClosestPointIndex(source: number[], targets: number[][]): number {
  if (!targets.length)
    return 0;

  const closest = targets.reduce((a, b) => (distance(source, a) < distance(source, b) ? a : b));

  return targets.findIndex(coords => coords === closest);
}; */

function addNode(event: any) {
  if (selectedObjectIdx.value === null)
    return;

  const { offsetX, offsetY } = event;
  const p: [number, number] = [offsetX / width.value, offsetY / width.value];

  const newCoords = coords.value[selectedObjectIdx.value] as [number, number][];

  const closestIndex = closestSegmentIndex(newCoords, p);
  const insertAt = (closestIndex + 1) % newCoords.length;
  newCoords.splice(insertAt, 0, p);
};

function updateNode(objIdx: number, nodeIdx: number, [x, y]: number[]) {
  coords.value[objIdx].splice(nodeIdx, 1, [x / width.value, y / width.value]);
};

function removeNode(nodeIdx: number) {
  if (selectedObjectIdx.value === null)
    return;

  coords.value[selectedObjectIdx.value].splice(nodeIdx, 1);
};

function dragNode(event: any, index: number) {
  if (selectedObjectIdx.value === null)
    return;

  selectedNodeIdx.value = index;

  const { offsetX, offsetY } = event;
  updateNode(selectedObjectIdx.value, index, [offsetX, offsetY]);
  svg.value?.addEventListener('mousemove', moveNode);
};

function moveNode(event: any) {
  if (selectedObjectIdx.value === null || selectedNodeIdx.value === null) {
    dropNode();
    return;
  }

  const { offsetX, offsetY } = event;
  updateNode(selectedObjectIdx.value, selectedNodeIdx.value, [offsetX, offsetY]);
};

function dropNode() {
  selectedNodeIdx.value = null;
  svg.value?.removeEventListener('mousemove', moveNode);
};

watchDebounced(
  imageMapObjects,
  () => {
    updateImageMapObjects();
  },
  { debounce: 500, maxWait: 2000 },
);

watchDebounced(
  guideImageObjects,
  () => {
    updateGuideImageObjects();
  },
  { debounce: 500, maxWait: 2000 },
);
</script>

<style lang="scss" scoped>
.guides-drawer {
  position: relative;
  outline: 0;
  user-select: none;

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .guides-drawer-polygon {
      cursor: pointer;
      fill: transparent;
      stroke-width: 3;
      stroke: rgba(0, 0, 0);
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-opacity: 0.8;

      &.active {
        fill: rgba(0, 0, 0, 0.4);
      }

      &:hover {
        fill: rgba(0, 0, 0, 0.5);
      }
    }

    .guides-drawer-node {
      fill: rgba(0, 0, 0);
      fill-opacity: 0.8;
      r: 5px;
    }
  }
}
</style>
