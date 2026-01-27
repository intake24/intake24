import type { Replace } from 'type-fest';
import type { Ref } from 'vue';

import type { ImageMap, Prompt } from '@intake24/common/prompts';
import type { EncodedFood } from '@intake24/common/surveys';
import type { ImageMapResponse } from '@intake24/common/types/http';
import type { AsServedSetResponse, DrinkwareSetResponse, GuideImageResponse } from '@intake24/common/types/http/foods';

import { computed } from 'vue';

import { useFoodUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

import { usePortionSizeMethod } from './use-portion-size-method';

export type UseLabelsProps = {
  food: EncodedFood;
  prompt: Prompt & { imageMap: ImageMap };
};

export type UseLabelsSource
  = { type: 'imageMap'; data: Ref<ImageMapResponse | null> }
    | { type: 'guideImage'; data: Ref<GuideImageResponse | null> }
    | { type: 'asServed'; data: Ref<AsServedSetResponse | null> }
    | { type: 'drinkScale'; data: Ref<{ drinkwareSet: DrinkwareSetResponse | null; imageMap: ImageMapResponse | null }> };

export function useLabels<P extends 'as-served-prompt' | 'cereal-prompt' | 'guide-image-prompt' | 'drink-scale-prompt'>(props: UseLabelsProps, source: UseLabelsSource) {
  const { translate } = useI18n();
  const { foodName } = useFoodUtils(props);
  const { parameters } = usePortionSizeMethod<Replace<P, '-prompt', ''>>(props);

  const labelsEnabled = computed(() => typeof props.prompt.imageMap.labels === 'boolean' ? props.prompt.imageMap.labels : !!parameters.value.labels);

  function resolveAsServedLabels(data: AsServedSetResponse | null) {
    if (!data)
      return { image: '', objects: [] };

    const food = foodName.value;

    const image = translate(data.label, { params: { food } });
    const objects = data.images.map(({ label, weight }) => translate(label, { params: { food, weight } }) || `${Math.round(weight)}g`);

    return { image, objects };
  }

  function resolveGuideImageLabels(data: GuideImageResponse | null) {
    if (!data)
      return { image: '', objects: [] };

    const food = foodName.value;

    const image = translate(data.label, { params: { food } }) || translate(data.imageMap.label, { params: { food } });
    const objects = data.imageMap.objects.map((object) => {
      const { label, weight } = data.objects[object.id];

      return translate(label, { params: { food, weight } }) || translate(object.label, { params: { food, weight } });
    });

    return { image, objects };
  }

  function resolveImageMapLabels(data: ImageMapResponse | null) {
    if (!data)
      return { image: '', objects: [] };

    const food = foodName.value;

    const image = translate(data.label, { params: { food } });
    const objects = data.objects.map(({ label }) => translate(label, { params: { food } }));

    return { image, objects };
  }

  function resolveDrinkwareLabels({ drinkwareSet, imageMap }: { drinkwareSet: DrinkwareSetResponse | null; imageMap: ImageMapResponse | null }) {
    if (!drinkwareSet || !imageMap)
      return { image: '', objects: [] };

    const food = foodName.value;

    const image = translate(drinkwareSet.label, { params: { food } }) || translate(imageMap.label, { params: { food } });

    const objects = imageMap.objects.map((object) => {
      const scale = drinkwareSet.scales.find(({ choiceId }) => choiceId.toString() === object.id);
      if (!scale)
        return '';

      const volume = scale.version === 1
        ? scale.volumeSamples[scale.volumeSamples.length - 1]
        : scale.volumeSamplesNormalised[scale.volumeSamplesNormalised.length - 1];

      return translate(scale.label, { params: { food, volume } }) || translate(object.label, { params: { food, volume } });
    });

    return { image, objects };
  }

  const resolveLabels = {
    asServed: resolveAsServedLabels,
    guideImage: resolveGuideImageLabels,
    drinkScale: resolveDrinkwareLabels,
    imageMap: resolveImageMapLabels,
  };

  const labels = computed(() => {
    if (!labelsEnabled.value)
      return { image: '', objects: [] };

    // @ts-expect-error - narrow down the type
    return resolveLabels[source.type](source.data.value);
  });

  return {
    labelsEnabled,
    labels,
  };
}
