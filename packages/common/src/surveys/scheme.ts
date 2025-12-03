import type { Condition, Prompt, SinglePrompt } from '../prompts';
import type { Meal } from './meals';
import { isLocale } from 'validator';
import { z } from 'zod';
import { basePrompt, CurrentPromptVersion, prompt, singlePrompt } from '../prompts';

export const schemeTypes = ['default'] as const;
export type SchemeType = (typeof schemeTypes)[number];

export const recallFlows = ['1-pass', '2-pass'] as const;
export type RecallFlow = (typeof recallFlows)[number];

export const helpAvailableFields = ['name', 'email', 'phone', 'message'] as const;
export type HelpAvailableField = (typeof helpAvailableFields)[number];
export const helpRequiredFields = [...helpAvailableFields, 'email|phone'] as const;
export type HelpRequiredField = (typeof helpRequiredFields)[number];

const localePattern = /^[a-z]{2}(?:[-_][A-Za-z0-9]+|[A-Z][A-Za-z0-9]*)?$/;

function isSupportedLocale(value: string): boolean {
  if (isLocale(value))
    return true;

  if (localePattern.test(value))
    return true;

  return false;
}

export const schemeSettings = z.object({
  type: z.enum(schemeTypes),
  flow: z.enum(recallFlows),
  recallDate: z.coerce.number().int().nullable(),
  languages: z.string().refine(isSupportedLocale).array(),
  help: z.object({
    enabled: z.boolean().default(true),
    available: z.enum(helpAvailableFields).array(),
    required: z.enum(helpRequiredFields).array(),
  }),
});
export type SchemeSettings = z.infer<typeof schemeSettings>;

export const defaultSchemeSettings: SchemeSettings = {
  type: 'default',
  flow: '2-pass',
  recallDate: null,
  languages: [],
  help: {
    enabled: true,
    available: ['name', 'email', 'phone', 'message'],
    required: ['name', 'email|phone', 'message'],
  },
};

export const surveySections = ['preMeals', 'postMeals', 'submission'] as const;
export type SurveyPromptSection = (typeof surveySections)[number];

export const mealSections = ['preFoods', 'foods', 'postFoods', 'foodsDeferred'] as const;
export type MealSection = (typeof mealSections)[number];

export const foodSections = ['foods', 'foodsDeferred'] as const;
export type FoodSection = (typeof foodSections)[number];

export const promptSections = [...surveySections, ...mealSections] as const;
export type PromptSection = (typeof promptSections)[number];

export const promptWithSection = basePrompt.extend({
  section: z.enum(promptSections),
});
export type PromptWithSection = z.infer<typeof promptWithSection>;

export function isMealSection(section: any): section is MealSection {
  return mealSections.includes(section);
}

export function isSurveySection(section: any): section is SurveyPromptSection {
  return surveySections.includes(section);
}

export type SurveySection = SurveyPromptSection | 'meals';

export const recallPrompts = z.object({
  preMeals: singlePrompt.array(),
  meals: z.object({
    preFoods: singlePrompt.array(),
    foods: singlePrompt.array(),
    postFoods: singlePrompt.array(),
    foodsDeferred: singlePrompt.array(),
  }),
  postMeals: singlePrompt.array(),
  submission: singlePrompt.array(),
});
export type RecallPrompts = z.infer<typeof recallPrompts>;

export const groupedRecallPrompts = z.object({
  preMeals: prompt.array(),
  meals: z.object({
    preFoods: prompt.array(),
    foods: prompt.array(),
    postFoods: prompt.array(),
    foodsDeferred: prompt.array(),
  }),
  postMeals: prompt.array(),
  submission: prompt.array(),
});
export type GroupedRecallPrompts = z.infer<typeof groupedRecallPrompts>;

export function flattenScheme(scheme: RecallPrompts): SinglePrompt[] {
  return Object.values(scheme).reduce<SinglePrompt[]>((acc, prompts) => {
    // @ts-expect-error fix
    acc.push(...(Array.isArray(prompts) ? prompts : flattenScheme(prompts)));
    return acc;
  }, []);
}

export function flattenSchemeWithSection(scheme: RecallPrompts): PromptWithSection[] {
  return Object.entries(scheme).reduce<PromptWithSection[]>((acc, [section, prompts]) => {
    const items = Array.isArray(prompts)
      ? prompts.map(prompt => ({ ...prompt, section }))
      // @ts-expect-error fix
      : flattenSchemeWithSection(prompts);

    // @ts-expect-error fix
    acc.push(...items);
    return acc;
  }, []);
}

export function groupMultiPrompts(prompts: SinglePrompt[]) {
  const grouped = prompts.reduce<
    Record<string, { idx: number; prompts: SinglePrompt[]; conditions: Condition[]; inserted: boolean }>
  >((acc, item, idx) => {
    if (item.type !== 'custom' || !item.group)
      return acc;

    if (!acc[item.group])
      acc[item.group] = { idx, prompts: [], conditions: [], inserted: false };
    acc[item.group].prompts.push(item);
    acc[item.group].conditions.push(...item.conditions);

    return acc;
  }, {});

  if (!Object.keys(grouped).length)
    return prompts;

  return prompts.reduce<Prompt[]>((acc, item) => {
    if (item.type !== 'custom' || !item.group) {
      acc.push(item);
      return acc;
    }

    if (!grouped[item.group].inserted) {
      acc.push({
        id: `multiple-prompt-${item.group}`,
        type: 'custom',
        name: `multiple-prompt-${item.group}`,
        component: 'multi-prompt',
        prompts: grouped[item.group].prompts,
        version: CurrentPromptVersion,
        i18n: {},
        conditions: grouped[item.group].conditions,
        useGraph: false,
      });
      grouped[item.group].inserted = true;
    }
    return acc;
  }, []);
}

export function groupSchemeMultiPrompts(scheme: RecallPrompts): GroupedRecallPrompts {
  return {
    preMeals: groupMultiPrompts(scheme.preMeals),
    meals: {
      preFoods: groupMultiPrompts(scheme.meals.preFoods),
      foods: groupMultiPrompts(scheme.meals.foods),
      postFoods: groupMultiPrompts(scheme.meals.postFoods),
      foodsDeferred: groupMultiPrompts(scheme.meals.foodsDeferred),
    },
    postMeals: groupMultiPrompts(scheme.postMeals),
    submission: groupMultiPrompts(scheme.submission),
  };
}

export const defaultMeal: Meal = { name: { en: 'Meal name' }, time: '8:00', flags: [] };

export const defaultMeals: Meal[] = [
  { name: { en: 'Breakfast' }, time: '8:00', flags: [] },
  { name: { en: 'Morning snack' }, time: '10:00', flags: [] },
  { name: { en: 'Lunch' }, time: '13:00', flags: [] },
  { name: { en: 'Afternoon snack' }, time: '16:00', flags: [] },
  { name: { en: 'Dinner' }, time: '18:00', flags: [] },
  { name: { en: 'Evening snack' }, time: '20:00', flags: [] },
];

export const exportSectionIds = [
  'user',
  'userCustom',
  'survey',
  'submission',
  'submissionCustom',
  'meal',
  'mealCustom',
  'food',
  'foodCustom',
  'foodNutrients',
  'foodFields',
  'portionSizes',
  'externalSources',
] as const;
export type ExportSectionId = (typeof exportSectionIds)[number];

export const exportField = z.object({
  id: z.string(),
  label: z.string(),
});
export type ExportField = z.infer<typeof exportField>;

export const exportSection = z.object({
  id: z.enum(exportSectionIds),
  fields: exportField.array(),
});
export type ExportSection = z.infer<typeof exportSection>;

export const defaultExport: ExportSection[] = exportSectionIds.map(id => ({ id, fields: [] }));

export const defaultPrompts: RecallPrompts = {
  preMeals: [],
  meals: {
    preFoods: [],
    foods: [],
    postFoods: [],
    foodsDeferred: [],
  },
  postMeals: [],
  submission: [],
};
