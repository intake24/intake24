import { z } from 'zod';
import { recordVisibilities } from '@intake24/common/security';
import { requiredLocaleTranslation } from '../../common';
import { userSecurableAttributes } from './securables';
import { owner } from './users';

export const faqItem = z.object({
  id: z.string(),
  title: requiredLocaleTranslation,
  content: requiredLocaleTranslation,
});
export type FAQItem = z.infer<typeof faqItem>;

export const faqSection = z.object({
  id: z.string(),
  title: requiredLocaleTranslation,
  items: faqItem.array(),
});
export type FAQSection = z.infer<typeof faqSection>;

export const faqAttributes = z.object({
  id: z.string(),
  name: z.string().min(1).max(256),
  content: faqSection.array(),
  ownerId: z.string().nullable(),
  visibility: z.enum(recordVisibilities),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type FAQAttributes = z.infer<typeof faqAttributes>;

export const faqRequest = faqAttributes.omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});
export type FAQRequest = z.infer<typeof faqRequest>;

export const faqEntry = faqAttributes.extend({
  owner: owner.optional(),
  securables: userSecurableAttributes.array().optional(),
});
export type FAQEntry = z.infer<typeof faqEntry>;
