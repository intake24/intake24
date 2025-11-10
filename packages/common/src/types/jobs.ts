import type { SurveyState } from '../surveys';
import { endOfDay, startOfDay } from 'date-fns';
import pick from 'lodash/pick';

import { z } from 'zod';

import { searchSortingAlgorithms } from '../surveys';
import { packageExportOptions } from './http/admin/io';

export const repeatableBullJob = z.object({
  key: z.string(),
  name: z.string(),
  id: z.string().nullish(),
  iterationCount: z.number().optional(),
  limit: z.number().optional(),
  endDate: z.number().optional(),
  tz: z.string().optional(),
  pattern: z.string().optional(),
  every: z.number().optional(),
  next: z.number().optional(),
  offset: z.number().optional(),
  template: z.object({
    data: z.any(),
    opts: z.any(),
  }).optional(),
});

export type RepeatableBullJob = z.infer<typeof repeatableBullJob>;

export type JobData<T extends JobType = JobType> = { type: T; params: JobParams[T] };

export const redisStoreTypes = ['cache', 'rateLimiter', 'session'] as const;
export type RedisStoreType = (typeof redisStoreTypes)[number];

export const CleanRedisStore = z.object({
  store: z.enum(redisStoreTypes).array(),
});
export const CleanStorageFiles = z.record(z.never());
export const FeedbackSchemesSync = z.record(z.never());
export const LanguageTranslationsSync = z.record(z.never());
export const LocaleIndexBuild = z.object({
  force: z.boolean().optional(),
});

export const localeCopyFoodsSubTasks = ['categories', 'foods', 'associatedFoods', 'attributes', 'brands', 'recipeFoods', 'splitLists', 'splitWords', 'synonymSets'] as const;
export type LocaleCopyFoodsSubTasks = (typeof localeCopyFoodsSubTasks)[number];
export const localeCopySystemSubTasks = ['searchPopularity', 'searchFixedRanking'] as const;
export type LocaleCopySystemSubTasks = (typeof localeCopySystemSubTasks)[number];
export const localeCopySubTasks = [...localeCopyFoodsSubTasks, ...localeCopySystemSubTasks] as const;
export type LocaleCopySubTasks = (typeof localeCopySubTasks)[number];

export const LocaleCopy = z.object({
  localeId: z.string(),
  sourceLocaleId: z.string(),
  subTasks: z.enum(localeCopySubTasks).array(),
});
export const LocaleFoods = z.object({
  localeId: z.string(),
});
export const LocaleFoodNutrientMapping = z.object({
  localeId: z.string(),
});
export const LocaleFoodRankingUpload = z.object({
  localeId: z.string(),
  file: z.string(),
  targetAlgorithm: z.enum(searchSortingAlgorithms),
});
export const NutrientTableDataImport = z.object({
  nutrientTableId: z.string(),
  file: z.string(),
});
export const NutrientTableMappingImport = z.object({
  nutrientTableId: z.string(),
  file: z.string(),
});
export const PopularitySearchUpdateCounters = z.object({
  localeCode: z.string(),
  foodCodes: z.array(z.string()),
});
export const PurgeExpiredTokens = z.record(z.never());

export const resources = [
  'as-served-sets',
  'as-served-sets.images',
  'drinkware-sets',
  'drinkware-sets.scales',
  'drinkware-sets.volumes',
  'guide-images',
  'guide-images.objects',
  'image-maps',
  'image-maps.objects',
  'languages',
  'locales',
  'nutrient-types',
  'standard-units',
] as const;

export const ResourceExport = z.object({
  language: z.string().array().optional(),
  resource: z.enum(resources),
});
export const SurveyAuthUrlsExport = z.object({
  surveyId: z.string(),
});
export const SurveyDataExport = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  surveyId: z.string(),
  // TODO: Fix this - multiform data are not cleaned of empty strings
  startDate: z.union([
    z.string().length(0).transform(val => val || undefined),
    z.coerce.date(),
  ]).nullish().transform(val => val ? startOfDay(val) : undefined),
  endDate: z.union([
    z.string().length(0).transform(val => val || undefined),
    z.coerce.date(),
  ]).nullish().transform(val => val ? endOfDay(val) : undefined),
  userId: z.string().optional(),
});

const baseSurveyEventNotification = z.object({
  surveyId: z.string(),
  userId: z.string(),
  sessionId: z.string(),
});

export const SurveyEventNotification = z.discriminatedUnion('type', [
  baseSurveyEventNotification.extend({
    type: z.literal('survey.session.started'),
  }),
  baseSurveyEventNotification.extend({
    type: z.literal('survey.session.cancelled'),
  }),
  baseSurveyEventNotification.extend({
    type: z.literal('survey.session.submitted'),
    submissionId: z.string(),
  }),
]);
export const SurveyFeedbackNotification = z.object({
  surveyId: z.string(),
  username: z.string(),
  submissions: z.array(z.string()).optional(),
  lang: z.string().optional(),
  to: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
});
export const SurveyHelpRequestNotification = z.object({
  surveySlug: z.string(),
  userId: z.string(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  phoneCountry: z.string().nullish(),
  message: z.string().nullish(),
});
export const SurveyNutrientsRecalculation = z.object({
  surveyId: z.string(),
});
export const SurveyRatingsExport = z.object({
  surveyId: z.string(),
});
export const SurveyRespondentsImport = z.object({
  surveyId: z.string(),
  file: z.string(),
});
export const SurveySchemesSync = z.object({});
export const SurveySessionsExport = z.object({
  surveyId: z.string(),
});
export const SurveySubmission = z.object({
  surveyId: z.string(),
  userId: z.string(),
  // TODO: Fix this
  state: z.any(),
});
export const UserEmailVerificationNotification = z.object({
  email: z.string(),
  userAgent: z.string().optional(),
});
export const UserPasswordResetNotification = z.object({
  email: z.string(),
  userAgent: z.string().optional(),
});
export const PackageVerification = z.object({
  importId: z.string().uuid(),
});

export const PackageExport = packageExportOptions;

export const PackageConversionToXlsx = z.object({});

export const jobParams = z.object({
  CleanRedisStore,
  CleanStorageFiles,
  FeedbackSchemesSync,
  LanguageTranslationsSync,
  LocaleIndexBuild,
  LocaleCopy,
  LocaleFoods,
  LocaleFoodNutrientMapping,
  LocaleFoodRankingUpload,
  NutrientTableDataImport,
  NutrientTableMappingImport,
  PopularitySearchUpdateCounters,
  PurgeExpiredTokens,
  ResourceExport,
  SurveyAuthUrlsExport,
  SurveyDataExport,
  SurveyEventNotification,
  SurveyFeedbackNotification,
  SurveyHelpRequestNotification,
  SurveyNutrientsRecalculation,
  SurveyRatingsExport,
  SurveyRespondentsImport,
  SurveySchemesSync,
  SurveySessionsExport,
  SurveySubmission,
  UserEmailVerificationNotification,
  UserPasswordResetNotification,
  PackageVerification,
  PackageExport,
  PackageConversionToXlsx,
});
export type JobParams = z.infer<typeof jobParams>;

export const jobTypeParams = z.union([
  CleanRedisStore,
  CleanStorageFiles,
  FeedbackSchemesSync,
  LanguageTranslationsSync,
  LocaleIndexBuild,
  LocaleCopy,
  LocaleFoods,
  LocaleFoodNutrientMapping,
  LocaleFoodRankingUpload,
  NutrientTableDataImport,
  NutrientTableMappingImport,
  PopularitySearchUpdateCounters,
  PurgeExpiredTokens,
  ResourceExport,
  SurveyAuthUrlsExport,
  SurveyDataExport,
  SurveyEventNotification,
  SurveyFeedbackNotification,
  SurveyHelpRequestNotification,
  SurveyNutrientsRecalculation,
  SurveyRatingsExport,
  SurveyRespondentsImport,
  SurveySchemesSync,
  SurveySessionsExport,
  SurveySubmission,
  UserEmailVerificationNotification,
  UserPasswordResetNotification,
]);
export type JobTypeParams = z.infer<typeof jobTypeParams>;

export const localeTasks = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('LocaleCopy'),
    params: LocaleCopy,
  }),
  z.object({
    type: z.literal('LocaleFoods'),
    params: LocaleFoods,
  }),
  z.object({
    type: z.literal('LocaleFoodNutrientMapping'),
    params: LocaleFoodNutrientMapping,
  }),
  z.object({
    type: z.literal('LocaleFoodRankingUpload'),
    params: LocaleFoodRankingUpload.omit({ file: true }),
  }),
]);
export type LocaleTask = z.infer<typeof localeTasks>;

export const localeJobs = [
  'LocaleCopy',
  'LocaleFoods',
  'LocaleFoodNutrientMapping',
  'LocaleFoodRankingUpload',
] as const;
export type LocaleJob = (typeof localeJobs)[number];

export const nutrientTableTasks = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('NutrientTableDataImport'),
    params: NutrientTableDataImport.omit({ file: true }),
  }),
  z.object({
    type: z.literal('NutrientTableMappingImport'),
    params: NutrientTableMappingImport.omit({ file: true }),
  }),
]);
export type NutrientTableTask = z.infer<typeof nutrientTableTasks>;

export const nutrientTableJobs = ['NutrientTableMappingImport', 'NutrientTableDataImport'] as const;
export type NutrientTableJob = (typeof nutrientTableJobs)[number];

export const surveyJobs = [
  'SurveyAuthUrlsExport',
  'SurveyDataExport',
  'SurveyNutrientsRecalculation',
  'SurveyRatingsExport',
  'SurveyRespondentsImport',
  'SurveySessionsExport',
] as const;
export type SurveyJob = (typeof surveyJobs)[number];

export const surveyTasks = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SurveyAuthUrlsExport'),
    params: SurveyAuthUrlsExport,
  }),
  z.object({
    type: z.literal('SurveyDataExport'),
    params: SurveyDataExport,
  }),
  z.object({
    type: z.literal('SurveyNutrientsRecalculation'),
    params: SurveyNutrientsRecalculation,
  }),
  z.object({
    type: z.literal('SurveyRatingsExport'),
    params: SurveyRatingsExport,
  }),
  z.object({
    type: z.literal('SurveyRespondentsImport'),
    params: SurveyRespondentsImport.omit({ file: true }),
  }),
  z.object({
    type: z.literal('SurveySessionsExport'),
    params: SurveySessionsExport,
  }),
]);
export type SurveyTask = z.infer<typeof surveyTasks>;

/* export const userTasks = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ResourceExport'),
    params: ResourceExport,
  }),
]); */
export const userTasks = z.object({
  type: z.literal('ResourceExport'),
  params: ResourceExport,
});
export type UserTasks = z.infer<typeof userTasks>;

export const userJobs = [
  'ResourceExport',
] as const;
export type UserJob = (typeof userJobs)[number];

export const ioJobs = [
  'PackageVerification',
  'PackageExport',
  'PackageConversionToXlsx',
] as const;
export type IOJob = (typeof ioJobs)[number];

export const jobTypes = [
  'CleanRedisStore',
  'CleanStorageFiles',
  'FeedbackSchemesSync',
  'LanguageTranslationsSync',
  'LocaleIndexBuild',
  'PopularitySearchUpdateCounters',
  'PurgeExpiredTokens',
  'ResourceExport',
  'SurveyEventNotification',
  'SurveyFeedbackNotification',
  'SurveyHelpRequestNotification',
  'SurveySchemesSync',
  'SurveySubmission',
  'UserEmailVerificationNotification',
  'UserPasswordResetNotification',
  ...localeJobs,
  ...nutrientTableJobs,
  ...surveyJobs,
  ...userJobs,
  ...ioJobs,
] as const;

export type JobType = keyof JobParams & (typeof jobTypes)[number];

export type GetJobParams<P extends keyof JobParams> = JobParams[P];

export type QueueJob<T extends JobType = JobType> = {
  userId: string;
  type: T;
  params: GetJobParams<T>;
};

export const defaultJobsParams: JobParams = {
  CleanRedisStore: { store: ['cache'] },
  CleanStorageFiles: {},
  FeedbackSchemesSync: {},
  LanguageTranslationsSync: {},
  LocaleIndexBuild: {
    force: false,
  },
  LocaleCopy: {
    localeId: '',
    sourceLocaleId: '',
    subTasks: [...localeCopySubTasks],
  },
  LocaleFoods: {
    localeId: '',
  },
  LocaleFoodNutrientMapping: {
    localeId: '',
  },
  LocaleFoodRankingUpload: {
    localeId: '',
    file: '',
    targetAlgorithm: 'fixed',
  },
  NutrientTableDataImport: {
    nutrientTableId: '',
    file: '',
  },
  NutrientTableMappingImport: {
    nutrientTableId: '',
    file: '',
  },
  PopularitySearchUpdateCounters: {
    localeCode: '',
    foodCodes: [],
  },
  PurgeExpiredTokens: {},
  ResourceExport: {
    resource: 'nutrient-types',
  },
  SurveyAuthUrlsExport: {
    surveyId: '',
  },
  SurveyDataExport: {
    id: undefined,
    surveyId: '',
    startDate: undefined,
    endDate: undefined,
    userId: undefined,
  },
  SurveyEventNotification: {
    type: 'survey.session.started',
    surveyId: '',
    sessionId: '',
    userId: '',
  },
  SurveyNutrientsRecalculation: {
    surveyId: '',
  },
  SurveyRatingsExport: {
    surveyId: '',
  },
  SurveyRespondentsImport: {
    surveyId: '',
    file: '',
  },
  SurveyHelpRequestNotification: {
    surveySlug: '',
    userId: '',
    name: '',
    email: '',
    phone: '',
    phoneCountry: 'GB',
    message: '',
  },
  SurveyFeedbackNotification: {
    surveyId: '',
    username: '',
    to: '',
  },
  SurveySchemesSync: {},
  SurveySessionsExport: {
    surveyId: '',
  },
  SurveySubmission: {
    surveyId: '',
    userId: '',
    state: {} as SurveyState,
  },
  UserEmailVerificationNotification: {
    email: '',
  },
  UserPasswordResetNotification: {
    email: '',
  },
  PackageVerification: {
    uploadedPath: '',
  },
};

export const isValidJob = (job: any): boolean => jobTypes.includes(job);

export function pickJobParams<T extends keyof JobParams>(object: object, job: T): JobParams[T] {
  return pick(object, Object.keys(defaultJobsParams[job])) as JobParams[T];
}

export function jobRequiresFile<T extends keyof JobParams>(job: T) {
  return Object.keys(defaultJobsParams[job]).includes('file');
}

export function jobHasParam<T extends keyof JobParams>(job: T, key: string) {
  return Object.keys(defaultJobsParams[job]).includes(key);
}
