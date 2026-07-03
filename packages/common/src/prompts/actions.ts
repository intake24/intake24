import { z } from 'zod';

import { variants } from '../theme';
import { localeTranslation } from '../types/common';
import { actionItem } from './action-item';
import { layoutTypes } from './partials';

export const promptActionItem = actionItem.extend({
  text: localeTranslation,
  label: localeTranslation,
  color: z.string().nullable(),
  variant: z.enum(variants),
  icon: z.string().nullable(),
  layout: z.enum(layoutTypes).array(),
});

export type PromptActionItem = z.infer<typeof promptActionItem>;

export const promptActions = z.object({
  both: z.boolean(),
  items: promptActionItem.array(),
});

export type PromptActions = z.infer<typeof promptActions>;

export const defaultAction: PromptActionItem = {
  type: 'next',
  text: { en: '' },
  label: {},
  color: 'primary',
  variant: 'text',
  icon: '$next',
  layout: ['desktop', 'mobile'],
  params: {},
};
