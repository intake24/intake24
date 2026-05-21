import type { MaybeRefOrGetter } from 'vue';

import type { FoodBuilder, FoodHeader } from '@intake24/common/types/http';

import { computed, ref, toRef } from 'vue';

import { foodsService } from '@intake24/survey/services';
import { useI18n } from '@intake24/ui';

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
    detected,
    exclusive,
    label,
    fetch,
    reset,
  };
}
