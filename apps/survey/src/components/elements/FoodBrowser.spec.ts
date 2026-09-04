import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import FoodBrowser from './FoodBrowser.vue';

const { sendGtmEvent, search } = vi.hoisted(() => ({
  sendGtmEvent: vi.fn(),
  search: vi.fn(),
}));
let runSearchWatcher: () => Promise<void>;

vi.mock('@vueuse/core', () => ({
  watchDebounced: (_source: unknown, callback: () => Promise<void>) => {
    runSearchWatcher = callback;
  },
}));

vi.mock('@intake24/survey/composables', () => ({
  usePromptUtils: () => ({
    foodBuilderEnabled: ref(false),
    translatePrompt: () => ({}),
    type: ref('foodSearch'),
  }),
}));

vi.mock('@intake24/survey/services', () => ({
  categoriesService: {
    contents: vi.fn().mockResolvedValue({ header: {}, foods: [], subcategories: [] }),
    header: vi.fn(),
  },
  foodsService: { search },
}));

vi.mock('@intake24/survey/util', () => ({ sendGtmEvent }));
vi.mock('@intake24/ui', () => ({ useI18n: () => ({ i18n: { t: (key: string) => key } }) }));
vi.mock('./use-food-builders.ts', () => ({
  useFoodBuilders: () => ({
    builders: ref([]),
    detected: ref(false),
    exclusive: ref(false),
    fetch: vi.fn(),
    foods: ref([]),
    label: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('food browser', () => {
  beforeEach(() => {
    search.mockClear();
    sendGtmEvent.mockClear();
    search.mockResolvedValue({ foods: [], categories: [] });
  });

  it('numbers the first typed search as one', async () => {
    const wrapper = shallowMount(FoodBrowser, {
      props: {
        localeId: 'en',
        prompt: {
          allowThumbnails: false,
          categoriesFirst: { browse: false, search: false },
          enableGrid: false,
          gridThreshold: 0,
          hints: [],
        } as never,
        section: 'foods',
        surveySlug: 'ndns-y18',
      },
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          FoodSearchHints: { template: '<div><slot /></div>' },
          VTextField: {
            props: ['modelValue'],
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
          },
        },
      },
    });

    await wrapper.find('input').setValue('apple');
    await flushPromises();
    await runSearchWatcher();

    expect(sendGtmEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'foodSearch',
      search_term: 'apple',
      search_term_order: 1,
    }));
  });
});
