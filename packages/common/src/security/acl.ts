import type { ValueOf } from 'type-fest';

export const ACL_PERMISSIONS_KEY = 'acl-permissions';
export const ACL_PAT_KEY = 'acl-pat';
export const ACL_ROLES_KEY = 'acl-roles';

export const respondentSuffix = '/respondent';

export const globalSupport = 'globalsupport';

export function surveyRespondent(surveySlug: string): string {
  return `${surveySlug.toLowerCase()}${respondentSuffix}`;
}

export const surveyPermissions = (surveySlug: string): string[] => [surveyRespondent(surveySlug)];

export const standardSecurableActions = ['read', 'edit', 'delete', 'securables'] as const;

export const securableDefs = {
  FAQ: [
    ...standardSecurableActions,
    'media',
    'use',
  ] as const,
  FeedbackScheme: [
    ...standardSecurableActions,
    'copy',
    'top-foods',
    'meals',
    'cards',
    'demographic-groups',
    'henry-coefficients',
    'media',
    'use',
  ] as const,
  Language: [...standardSecurableActions, 'translations', 'use'] as const,
  Locale: [
    ...standardSecurableActions,
    'copy',
    'food-list',
    'food-list:edit',
    'split-lists',
    'recipe-foods',
    'split-words',
    'synonym-sets',
    'tasks',
    'use',
  ] as const,
  SurveyScheme: [
    ...standardSecurableActions,
    'copy',
    'prompts',
    'data-export',
    'media',
    'use',
  ] as const,
  Survey: [
    ...standardSecurableActions,
    'overrides',
    'respondents',
    'sessions',
    'submissions',
    'support',
    'tasks',
  ] as const,
};

export type SecurableType = keyof typeof securableDefs;
export const securableTypes = Object.keys(securableDefs) as SecurableType[];

export type SecurableAction = ValueOf<typeof securableDefs>[number];

export const isSecurableType = (type: any): type is SecurableType => securableTypes.includes(type);

export const recordVisibilities = ['public', 'restricted'] as const;

export type RecordVisibility = (typeof recordVisibilities)[number];
