import type { FunctionalComponent, MaybeRefOrGetter } from 'vue';

import type { FoodBuilder, FoodHeader } from '@intake24/common/types/http';

import { computed, ref, toRef } from 'vue';

import { foodsService } from '@intake24/survey/services';
import { getIcon, useI18n } from '@intake24/ui';

export type UseFoodBuildersProps = {
  enabled: MaybeRefOrGetter<boolean>;
  localeId: MaybeRefOrGetter<string>;
};

export function useFoodBuilders(props: UseFoodBuildersProps) {
  const { i18n: { t }, translate } = useI18n();

  const enabled = toRef(props.enabled);
  const localeId = toRef(props.localeId);

  const foods = ref<FoodHeader[]>([]);
  const builders = ref<FoodBuilder[]>([]);
  const detected = computed(() => enabled.value && !!builders.value.length);
  const exclusive = computed(() => enabled.value && builders.value.some(builder => builder.exclusive));

  const icons = computed(() => builders.value.reduce((acc, { code, icon }) => {
    if (!icon)
      return acc;

    const svg = getIcon(icon);
    if (svg)
      acc[code] = svg;

    return acc;
  }, {} as Record<string, FunctionalComponent>));

  function label(builder: FoodBuilder) {
    return translate(builder.label) || t('prompts.recipeBuilder.label', { searchTerm: builder?.name });
  }

  async function fetch() {
    if (!enabled.value || !foods.value.length)
      return;

    builders.value = await foodsService.getFoodBuilders(localeId.value, foods.value.map(food => food.code));
  }

  function reset() {
    foods.value = [];
    builders.value = [];
  }

  return {
    foods,
    builders,
    icons,
    detected,
    exclusive,
    label,
    fetch,
    reset,
  };
}
