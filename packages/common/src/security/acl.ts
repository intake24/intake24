export const ACL_PERMISSIONS_KEY = 'acl-permissions';
export const ACL_ROLES_KEY = 'acl-roles';

export const respondentSuffix = '/respondent';

export const globalSupport = 'globalsupport';

export function surveyRespondent(surveySlug: string): string {
  return `${surveySlug.toLowerCase()}${respondentSuffix}`;
}

export const surveyPermissions = (surveySlug: string): string[] => [surveyRespondent(surveySlug)];

export const standardSecurableActions = ['read', 'edit', 'delete', 'securables'] as const;

export const securableDefs = {
  FeedbackScheme: [
    ...standardSecurableActions,
    'copy',
    'top-foods',
    'meals',
    'cards',
    'demographic-groups',
    'henry-coefficients',
    'use',
  ] as const,
  Language: [...standardSecurableActions, 'translations', 'use'] as const,
  Locale: [
    ...standardSecurableActions,
    'copy',
    'food-list',
    'split-lists',
    'recipe-foods',
    'split-words',
    'synonym-sets',
    'tasks',
    'use',
  ] as const,
  SurveyScheme: [...standardSecurableActions, 'copy', 'prompts', 'data-export', 'use'] as const,
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

export type FeedbackSchemeSecurableAction = (typeof securableDefs.FeedbackScheme)[number];
export type LanguageSecurableAction = (typeof securableDefs.Language)[number];
export type LocaleSecurableAction = (typeof securableDefs.Locale)[number];
export type SurveySchemeSecurableAction = (typeof securableDefs.SurveyScheme)[number];
export type SurveySecurableAction = (typeof securableDefs.Survey)[number];
export type SecurableAction = FeedbackSchemeSecurableAction | LanguageSecurableAction | LocaleSecurableAction | SurveySchemeSecurableAction | SurveySecurableAction;

export const isSecurableType = (type: any): type is SecurableType => securableTypes.includes(type);

export const recordVisibilities = ['public', 'restricted'] as const;

export type RecordVisibility = (typeof recordVisibilities)[number];
