<template>
  <v-alert v-if="labels.image" class="mb-2 text-body-2" color="info" variant="tonal">
    {{ labels.image }}
  </v-alert>
  <v-img :aspect-ratio="16 / 9" cover rounded :src="image">
    <template #placeholder>
      <image-placeholder />
    </template>
    <div class="label">
      <slot name="label" />
      <v-chip
        v-if="label"
        class="ma-1 ma-md-2 pa-3 pa-md-4 text-h6 font-weight-bold border-info-1"
        color="info"
      >
        {{ label }}
      </v-chip>
    </div>
    <as-served-weight-factor
      v-bind="weightFactorProps"
      @update:model-value="updateWeightFactor"
    />
  </v-img>
  <v-container class="px-2">
    <v-row v-if="asServedData">
      <v-col class="pa-1 rounded-lg" :class="{ 'border-primary-2': isLessWeightFactorActive }" cols="3" lg sm="2">
        <v-card :disabled="isLessWeightFactorActive" @click="updateSelection(-1)">
          <v-img cover :src="firstThumbnail" />
          <v-overlay
            absolute
            class="align-center justify-center"
            contained
            :model-value="true"
            scroll-strategy="none"
          >
            <v-btn
              color="transparent"
              :disabled="isLessWeightFactorActive"
              icon
              size="x-large"
              :title="$t(`prompts.asServed.${type}.less`)"
            >
              <v-icon color="white" size="large">
                $decrement
              </v-icon>
            </v-btn>
          </v-overlay>
        </v-card>
      </v-col>
      <v-col
        v-for="(images, idx) in asServedData.images" :key="idx"
        class="pa-1 rounded-lg"
        :class="{ 'border-primary-2': isSelected(idx) }"
        cols="3"
        lg
        sm="2"
      >
        <v-card @click="setSelection(idx)">
          <v-img cover :src="images.thumbnailUrl" />
        </v-card>
      </v-col>
      <v-col v-if="showMoreWeightFactor" class="pa-1 rounded-lg" :class="{ 'border-primary-2': isMoreWeightFactorActive }" cols="3" lg sm="2">
        <v-card :disabled="isMoreWeightFactorActive" @click="updateSelection(1)">
          <v-img cover :src="lastThumbnail" />
          <v-overlay
            absolute
            class="align-center justify-center"
            contained
            :model-value="true"
            scroll-strategy="none"
          >
            <v-btn
              color="transparent"
              :disabled="isMoreWeightFactorActive"
              icon
              size="x-large"
              :title="$t(`prompts.asServed.${type}.more`)"
            >
              <v-icon color="white" size="large">
                $increment
              </v-icon>
            </v-btn>
          </v-overlay>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="px-1" cols="12" sm="auto">
        <v-btn :block="$vuetify.display.mobile" color="primary" @click="confirm">
          {{ $t(`prompts.asServed.${type}.confirm`) }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { WeightFactorProps } from './AsServedWeightFactor.vue';
import { computed, ref, watch } from 'vue';
import type { Prompts } from '@intake24/common/prompts';
import type { EncodedFood, SelectedAsServedImage } from '@intake24/common/surveys';
import type { AsServedSetResponse } from '@intake24/common/types/http/foods';
import { ImagePlaceholder } from '@intake24/survey/components/elements';
import AsServedWeightFactor from './AsServedWeightFactor.vue';
import { useFetchImageData } from './use-fetch-image-data';
import { useLabels } from './use-labels';

const props = defineProps({
  asServedSetId: {
    type: String,
    required: true,
  },
  food: {
    type: Object as PropType<EncodedFood>,
    required: true,
  },
  maxWeight: {
    type: Number,
  },
  prompt: {
    type: Object as PropType<Prompts['as-served-prompt' | 'cereal-prompt']>,
    required: true,
  },
  type: {
    type: String as PropType<'serving' | 'leftovers'>,
    default: 'serving',
  },
  modelValue: {
    type: Object as PropType<SelectedAsServedImage | null>,
    default: null,
  },
});

const emit = defineEmits(['confirm', 'update:modelValue']);

const denominator = 4;
const objectIdx = ref<number | undefined>(undefined);

const asServedUrl = computed(() => `portion-sizes/as-served-sets/${props.asServedSetId}`);

const { imageData: asServedData } = useFetchImageData<AsServedSetResponse>({
  url: asServedUrl,
  onFetch: () => {
    initSelection();
  },
});

const { labels } = useLabels(props, { type: 'asServed', data: asServedData });
const label = computed(() => {
  if (objectIdx.value === undefined || !asServedData.value)
    return null;

  return labels.value.objects.at(objectIdx.value);
});

function noWeightFactor(weight: number): WeightFactorProps {
  return {
    show: false,
    type: props.type,
    subType: 'less',
    minNumerator: denominator,
    maxNumerator: denominator,
    denominator,
    weight,
    modelValue: denominator,
  };
}

function lessWeightFactor(show: boolean, weight: number, modelValue?: number): WeightFactorProps {
  return {
    show,
    type: props.type,
    subType: 'less',
    minNumerator: 1,
    maxNumerator: denominator - 1,
    denominator,
    weight,
    modelValue: modelValue ?? denominator - 1,
  };
}

function moreWeightFactor(show: boolean, weight: number, modelValue?: number): WeightFactorProps {
  let minNumerator = denominator + 1;
  let maxNumerator = denominator * 5;

  if (props.maxWeight) {
    if ((minNumerator / denominator) * weight >= props.maxWeight) {
      minNumerator = denominator;
      maxNumerator = denominator;
      modelValue = denominator;
    }
    else {
      maxNumerator = denominator;

      while (
        ((maxNumerator + 1) / denominator) * weight < props.maxWeight
        && maxNumerator <= denominator * 5
      ) {
        maxNumerator += 1;
      }
    }
  }

  return {
    show,
    type: props.type,
    subType: 'more',
    minNumerator,
    maxNumerator,
    denominator,
    weight,
    modelValue: modelValue ?? denominator + 1,
  };
}

const weightFactorProps = ref(noWeightFactor(0));

// Reset state when the as-served set changes (e.g., when switching bowls in cereal prompt)
watch(() => props.asServedSetId, () => {
  objectIdx.value = undefined;
  weightFactorProps.value = noWeightFactor(0);
});

const image = computed(() => {
  if (objectIdx.value === undefined)
    return '';

  return asServedData.value?.images[objectIdx.value].mainImageUrl ?? '';
});
const isLessWeightFactorActive = computed(() => weightFactorProps.value.show && weightFactorProps.value.subType === 'less');
const isMoreWeightFactorActive = computed(() => weightFactorProps.value.show && weightFactorProps.value.subType === 'more');
const firstThumbnail = computed(() => {
  if (objectIdx.value === undefined)
    return '';

  return asServedData.value?.images[0].thumbnailUrl ?? '';
});
const lastThumbnail = computed(() => {
  if (objectIdx.value === undefined || !asServedData.value)
    return '';

  return asServedData.value.images[asServedData.value.images.length - 1].thumbnailUrl;
});
const showMoreWeightFactor = computed(() => {
  if (props.maxWeight === undefined)
    return true;

  if (objectIdx.value === undefined || !asServedData.value || !asServedData.value.images.length)
    return false;

  const { weight } = asServedData.value.images[asServedData.value.images.length - 1];

  return ((denominator + 1) / denominator) * weight < props.maxWeight;
});
const weightFactor = computed(() => weightFactorProps.value.modelValue / weightFactorProps.value.denominator);

function initSelection() {
  if (!asServedData.value || objectIdx.value !== undefined)
    return;

  const { maxWeight } = props;

  if (maxWeight) {
    asServedData.value.images = asServedData.value.images.filter(
      image => image.weight <= maxWeight,
    );
  }

  if (props.modelValue?.index !== undefined)
    setSelection(props.modelValue.index, true);
  else setSelection(Math.floor(asServedData.value.images.length / 2));
};

function initWeightFactor(asServedData: AsServedSetResponse, objectIdx: number) {
  const objectWeight = asServedData.images[objectIdx].weight;
  const initWeight = props.modelValue?.weight;

  if (initWeight === undefined)
    return;

  const value = Math.round((initWeight / objectWeight) * denominator);

  if (initWeight > objectWeight && objectIdx === asServedData.images.length - 1) {
    weightFactorProps.value = moreWeightFactor(
      true,
      asServedData.images[objectIdx].weight,
      value,
    );

    return;
  }

  if (initWeight < objectWeight && objectIdx === 0) {
    weightFactorProps.value = lessWeightFactor(
      true,
      asServedData.images[objectIdx].weight,
      value,
    );

    return;
  }

  noWeightFactor(asServedData.images[objectIdx].weight);
};

function setSelection(idx: number, init = false) {
  if (!asServedData.value)
    return;

  if (idx >= asServedData.value.images.length) {
    weightFactorProps.value = moreWeightFactor(
      true,
      asServedData.value.images[asServedData.value.images.length - 1].weight,
    );
    update();
    return;
  }

  if (idx < 0) {
    weightFactorProps.value = lessWeightFactor(true, asServedData.value.images[0].weight);
    update();
    return;
  }

  objectIdx.value = idx;

  if (init)
    initWeightFactor(asServedData.value, idx);
  else weightFactorProps.value = noWeightFactor(asServedData.value.images[idx].weight);
  update();
};

function updateSelection(value: number) {
  if (objectIdx.value === undefined)
    return;

  setSelection(objectIdx.value + value);
};

function updateWeightFactor(value: number) {
  weightFactorProps.value.modelValue = value;
  update();
};

function isSelected(idx: number) {
  if (isLessWeightFactorActive.value || isMoreWeightFactorActive.value)
    return false;

  return idx === objectIdx.value;
};

function update() {
  if (objectIdx.value === undefined || !asServedData.value)
    return;

  const state: SelectedAsServedImage = {
    asServedSetId: props.asServedSetId,
    index: objectIdx.value,
    weight: asServedData.value.images[objectIdx.value].weight * weightFactor.value,
    imageUrl: asServedData.value.images[objectIdx.value].mainImageUrl,
  };

  emit('update:modelValue', state);
};

function confirm() {
  if (objectIdx.value === undefined)
    return;

  emit('confirm');
};
</script>

<style lang="scss" scoped>
.label {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
</style>
