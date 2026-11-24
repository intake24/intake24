import { enableAutoUnmount, flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import FoodBrowser from './FoodBrowser.vue';

enableAutoUnmount(afterEach);

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
  usePromptUtils: (props: { prompt: { component: string } }) => ({
    foodBuilderEnabled: ref(false),
    translatePrompt: () => ({}),
    type: computed(() => props.prompt.component === 'food-search-prompt'
      ? 'foodSearch'
      : 'recipeBuilder'),
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
vi.mock('@intake24/ui', () => ({
  useI18n: () => ({
    i18n: {
      t: (key: string) => key,
    },
  }),
}));
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

function mountBrowser(inDialog = false, component = 'food-search-prompt') {
  return shallowMount(FoodBrowser, {
    props: {
      inDialog,
      localeId: 'en',
      prompt: {
        id: 'find-food',
        component,
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
        FoodBrowserDialog: false,
        VCard: { template: '<div><slot /></div>' },
        FoodSearchHints: { template: '<div><slot /></div>' },
        VTextField: {
          props: ['modelValue'],
          methods: {
            focus() {},
          },
          template: '<input @focus="$emit(\'focus\')" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
        },
      },
    },
  });
}

function scrollDocument(top: number, height = 1200, viewport = 200) {
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(top);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(height);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(viewport);
  document.dispatchEvent(new Event('scroll', { bubbles: true }));
}

function scrollEvents() {
  return sendGtmEvent.mock.calls.map(([event]) => event).filter(event => event.event === 'foodSearchScroll');
}

describe('food browser', () => {
  beforeEach(() => {
    search.mockClear();
    sendGtmEvent.mockClear();
    search.mockResolvedValue({ foods: [], categories: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('numbers the first typed search as one', async () => {
    const wrapper = mountBrowser();

    await wrapper.find('input').setValue('apple');
    await flushPromises();
    await runSearchWatcher();

    expect(sendGtmEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'foodSearch',
      search_term: 'apple',
      search_term_order: 1,
    }));
  });

  it('emits each scroll threshold with the prompt id without another search', async () => {
    mountBrowser();
    await flushPromises();
    scrollDocument(800);
    scrollDocument(300);
    scrollDocument(950);
    scrollDocument(1000);
    expect(scrollEvents()).toEqual([25, 50, 75, 90].map(percent_scrolled => ({
      event: 'foodSearchScroll',
      prompt_id: 'find-food',
      section: 'foods',
      percent_scrolled,
    })));
  });

  it('keeps thresholds across searches and restarts them on the next prompt visit', async () => {
    const wrapper = mountBrowser();
    await flushPromises();
    scrollDocument(500);
    await wrapper.find('input').setValue('apple');
    await runSearchWatcher();
    scrollDocument(500);
    expect(scrollEvents().map(event => event.percent_scrolled)).toEqual([25, 50]);
    expect(sendGtmEvent.mock.calls.find(([event]) => event.event === 'foodSearch')?.[0])
      .not
      .toHaveProperty('percent_scrolled');
    wrapper.unmount();
    scrollDocument(1000);
    expect(scrollEvents().map(event => event.percent_scrolled)).toEqual([25, 50]);
    mountBrowser();
    await flushPromises();
    scrollDocument(500);
    expect(scrollEvents().map(event => event.percent_scrolled)).toEqual([25, 50, 25, 50]);
  });

  it('ignores loading and non-scrollable content', async () => {
    mountBrowser();
    scrollDocument(1000);
    expect(scrollEvents()).toEqual([]);
    await flushPromises();
    scrollDocument(0, 200, 200);
    expect(scrollEvents()).toEqual([]);
  });

  it('does not emit food search scroll events from another prompt type', async () => {
    mountBrowser(false, 'recipe-builder-prompt');
    await flushPromises();
    scrollDocument(1000);
    expect(scrollEvents()).toEqual([]);
  });

  it('tracks the mobile dialog scrolling surface instead of the document', async () => {
    vi.stubGlobal('innerWidth', 500);
    window.dispatchEvent(new Event('resize'));
    const wrapper = mountBrowser(true);
    await flushPromises();
    await wrapper.find('input').trigger('focus');
    await flushPromises();
    const content = wrapper.find('.food-browser-dialog-content');
    expect(content.exists()).toBe(true);
    Object.defineProperties(content.element, {
      scrollTop: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 1200 },
      clientHeight: { configurable: true, value: 200 },
    });
    scrollDocument(1000);
    expect(scrollEvents()).toEqual([]);
    await content.trigger('scroll');
    expect(scrollEvents().map(event => event.percent_scrolled)).toEqual([25, 50]);

    wrapper.findComponent({ name: 'FoodBrowserDialog' }).vm.$emit('update:modelValue', false);
    await flushPromises();
    scrollDocument(950);
    expect(scrollEvents().map(event => event.percent_scrolled)).toEqual([25, 50, 75, 90]);
  });
});
