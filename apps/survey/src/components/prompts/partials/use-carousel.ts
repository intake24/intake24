import type { Carousel, Prompt } from '@intake24/common/prompts';

import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

export type UseCarouselProps = Prompt & { carousel?: Carousel };

export function useCarousel(props: UseCarouselProps) {
  const carousel = ref(0);
  const watched = ref(false);
  const display = useDisplay();

  function resolveSlideUrl(slideUrl: Carousel['slides'][number]['image']) {
    const url = slideUrl[display.mobile.value ? 'mobile' : 'desktop'] ?? '';
    const sameOrigin = new URL(document.baseURI).origin === new URL(url, document.baseURI).origin;
    return sameOrigin && import.meta.env.VITE_API_HOST ? `${import.meta.env.VITE_API_HOST}/${url}` : url;
  }

  watch(carousel, (val) => {
    if (val + 1 === props.carousel?.slides.length)
      watched.value = true;
  });

  const isValid = computed(() => !props.carousel?.required || carousel.value !== null);

  return {
    carousel,
    isValid,
    resolveSlideUrl,
    watched,
  };
}
