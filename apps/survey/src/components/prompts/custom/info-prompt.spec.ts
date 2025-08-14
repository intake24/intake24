import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { infoPrompt } from '@intake24/common/prompts';
import type { Prompts } from '@intake24/common/prompts';
import type { CustomPromptAnswer } from '@intake24/common/surveys';
import InfoPrompt from './info-prompt.vue';

const state: CustomPromptAnswer | undefined = 'next';

describe('infoPrompt', () => {
  const prompt: Prompts['info-prompt'] = infoPrompt;

  it('renders correctly with required props', async () => {
    const wrapper = mount(InfoPrompt, {
      props: {
        prompt,
        modelValue: state,
        section: 'preMeals',
      },
    });

    const promptEl = wrapper.find('.prompt');
    const next = promptEl.find('.prompt__actions button');

    expect(promptEl.exists()).toBe(true);
    expect(next.exists()).toBe(true);
    expect(next.attributes('disabled')).toBeUndefined();
  });

  it('emits next', async () => {
    const wrapper = mount(InfoPrompt, {
      props: {
        prompt,
        modelValue: state,
        section: 'preMeals',
      },
    });

    const next = wrapper.find('.prompt__actions button');
    await next.trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
    expect(wrapper.emitted('action')?.at(0)).toEqual(['next']);
  });
});

describe('infoPrompt with carousel', () => {
  const prompt: Prompts['info-prompt'] = {
    ...infoPrompt,
    carousel: {
      color: 'info',
      variant: 'tonal',
      required: false,
      slides: [
        { id: 'Slide 1', text: { en: 'Content for slide 1' }, image: {} },
        { id: 'Slide 2', text: { en: 'Content for slide 2' }, image: {} },
        { id: 'Slide 3', text: { en: 'Content for slide 3' }, image: {} },
      ],
    },
  };

  it('renders correctly with required props', async () => {
    const wrapper = mount(InfoPrompt, {
      props: {
        prompt,
        modelValue: state,
        section: 'preMeals',
      },
    });

    const promptEl = wrapper.find('.prompt');
    const carousel = promptEl.find('.carousel');
    const next = promptEl.find('.prompt__actions button');

    expect(promptEl.exists()).toBe(true);
    expect(carousel.exists()).toBe(true);
    expect(next.exists()).toBe(true);
    expect(next.attributes('disabled')).toBeUndefined();
  });

  it('emits next', async () => {
    const wrapper = mount(InfoPrompt, {
      props: {
        prompt,
        modelValue: state,
        section: 'preMeals',
      },
    });

    const next = wrapper.find('.prompt__actions button');
    await next.trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
    expect(wrapper.emitted('action')?.at(0)).toEqual(['next']);
  });

  it('does not emits next when carousel required', async () => {
    prompt.carousel.required = true;
    const wrapper = mount(InfoPrompt, {
      props: {
        prompt,
        modelValue: state,
        section: 'preMeals',
      },
    });

    const promptEl = wrapper.find('.prompt');
    let next = wrapper.find('.prompt__actions button');
    const carousel = promptEl.find('.carousel');
    expect(next.exists()).toBe(false);
    expect(carousel.exists()).toBe(true);

    const slides = carousel.findAll('.v-window-item');
    expect(slides).toHaveLength(3);
    const carouselNext = wrapper.find('.v-window__controls button');
    await carouselNext.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);

    next = wrapper.find('.prompt__actions button');
    expect(next.exists()).toBe(false);

    /* await next.trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
    expect(wrapper.emitted('action')?.at(0)).toEqual(['next']); */
  });
});
