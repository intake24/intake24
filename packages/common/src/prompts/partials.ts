import { z } from 'zod';
import { variants } from '../theme';
import { localeTranslation } from '../types';

export const layoutTypes = ['desktop', 'mobile'] as const;
export type PromptLayout = (typeof layoutTypes)[number];

export const carousel = z.object({
  color: z.string(),
  variant: z.enum(variants),
  required: z.boolean(),
  slides: z.object({
    id: z.string(),
    text: localeTranslation,
    image: z.record(z.enum(layoutTypes), z.string().nullable()),
  }).array(),
});
export type Carousel = z.infer<typeof carousel>;

export const carouselDefaults: Carousel = {
  color: 'info',
  variant: 'tonal',
  required: false,
  slides: [],
};

const counterValue = z.number().positive().multipleOf(0.25).nullish().transform(val => val ?? undefined);
export const counter = z.object({
  type: z.literal('counter'),
  current: counterValue,
  min: counterValue,
  max: counterValue,
  confirm: z.boolean(),
  whole: z.boolean(),
  fraction: z.boolean(),
});
export type Counter = z.infer<typeof counter>;

export const counterDefaults: Counter = {
  type: 'counter',
  min: 0.25,
  max: 30,
  current: 1,
  confirm: false,
  whole: true,
  fraction: true,
};

export const datePicker = z.object({
  current: z.coerce.number().int().nullable(),
  min: z.coerce.number().int().nullable(),
  max: z.coerce.number().int().nullable(),
});
export type DatePicker = z.infer<typeof datePicker>;

export const sliderValue = z.object({
  value: z.number().nullable(),
  label: z.union([z.literal(false), localeTranslation]),
});
export type SliderValue = z.infer<typeof sliderValue>;

export const slider = z.object({
  type: z.literal('slider'),
  current: sliderValue.extend({ size: z.number() }),
  min: sliderValue,
  max: sliderValue,
  step: z.number(),
  confirm: z.boolean(),
});
export type Slider = z.infer<typeof slider>;

export const sliderDefaults: Slider = {
  type: 'slider',
  min: { value: 1, label: false },
  max: { value: 10, label: false },
  current: { value: 1, label: false, size: 50 },
  step: 1,
  confirm: false,
};

export const timePicker = z.object({
  format: z.enum(['ampm', '24hr']),
  amPmToggle: z.boolean(),
  allowedMinutes: z.union([z.literal(1), z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
  ui: z.enum(['digital', 'md-clock']),
});
export type TimePicker = z.infer<typeof timePicker>;

export const youtubeVideo = z.object({
  type: z.literal('youtube'),
  videoId: z.string(),
  height: z.number(),
  width: z.number(),
  autoContinue: z.boolean(),
  autoplay: z.boolean(),
  required: z.boolean(),
});
export type YoutubeVideo = z.infer<typeof youtubeVideo>;
export const hasVideo = z.object({ video: z.discriminatedUnion('type', [youtubeVideo]).optional() });
export type HasVideo = z.infer<typeof hasVideo>;

export const ytVideoDefaults: YoutubeVideo = {
  type: 'youtube',
  videoId: 't0ac25uWrxY',
  height: 720,
  width: 1280,
  autoContinue: false,
  autoplay: false,
  required: false,
};
