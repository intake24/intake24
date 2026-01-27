import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

import { computed, toValue, watch } from 'vue';
import { useDisplay, useGoTo } from 'vuetify';

import { isElementInViewport } from '@intake24/survey/util';

export function usePanel<T extends Ref<{ panel: number }>>(state: T, conditions: ComputedRef<boolean[]>) {
  const activePanel = computed(() => state.value.panel);
  useScrollToPanel(activePanel);

  const closePanels = () => {
    state.value.panel = -1;
  };

  const setPanel = (value: number) => {
    state.value.panel = value;
  };

  const updatePanel = () => {
    for (const [index, condition] of Object.entries(conditions.value)) {
      if (!condition) {
        state.value.panel = Number.parseInt(index);
        return;
      }
    }

    closePanels();
  };

  return {
    closePanels,
    setPanel,
    updatePanel,
  };
}

export function useScrollToPanel(panel: MaybeRefOrGetter<number | undefined>) {
  const goTo = useGoTo();
  const { mobile } = useDisplay();

  function scrollToPanel(index: number) {
    const targetIndex = index === -1 ? -1 : index - 1;
    const element = targetIndex === -1
      ? document.querySelector<HTMLElement>('.v-expansion-panels')
      : document.querySelectorAll<HTMLElement>('.v-expansion-panels > .v-expansion-panel > .v-expansion-panel-title')[targetIndex];

    if (!element || isElementInViewport(element))
      return;

    goTo(element, { offset: -50 });
  }

  watch(() => toValue(panel), (val) => {
    if (mobile.value)
      return;

    scrollToPanel(toValue(val ?? -1));
  });

  return {
    scrollToPanel,
  };
}
