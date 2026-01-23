import { createLocalVue, shallowMount } from '@vue/test-utils';

import Prompt from '@intake24/survey/components/prompts/portion/PortionSizeOptionPrompt.vue';
import i18n from '@intake24/survey/i18n';

// Vue.ls is not accessible so test falls over, need to refactor VueI18n.
// Useful: https://github.com/kazupon/vue-i18n/issues/323#issuecomment-463228178
const localVue = createLocalVue();
// const i18nA = VueI18n(localVue);

describe('testing Component', () => {
  // Mount with test props
  const props = {
    text: { en: 'Portion Size Options' },
    description: { en: 'Meat lasagne (includes homemade)' },
    localDescription: { en: 'Meat lasagne (includes homemade)' },
    methods: [
      {
        method: 'as-served',
        description: 'use_an_image',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fries_2.jpg/800px-Fries_2.jpg',
        // imageUrl: 'https://bad.src',
        pathways: ['search', 'afp'],
        conversionFactor: 0.0,
        parameters: {
          'serving-image-set': 'lasagne',
          'leftovers-image-set': 'lasagne_leftovers',
        },
      },
    ],
    validation: {
      required: false,
      message: { en: null },
    },
  };
  const wrapper = shallowMount(Prompt, {
    localVue,
    i18n,
    propsData: props,
  });

  // Expect error message will appear with no selection
  it('error when nothing selected', () => {
    expect(wrapper.text()).toContain('Meat lasagne (includes homemade)');
  });
});

// Expect no error when selecting any

// Expect styling to appear when selecting any
