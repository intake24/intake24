import { getSupportedRegionCodes, parsePhoneNumber } from 'awesome-phonenumber';
import { isIn } from 'validator';
import {
  groupedRecallPrompts,
  meal,
  schemeSettings,
  searchSortingAlgorithms,
  sessionSettings,
  surveyRatings,
  surveyStatuses,
} from '@intake24/common/surveys';
import { z } from '../../util';
import { userCustomField } from '../common';
import { faqSection } from './admin';
import { feedbackSchemeResponse } from './feedback';

export const generateUserResponse = z.object({
  username: z.string(),
  password: z.string(),
});

export type GenerateUserResponse = z.infer<typeof generateUserResponse>;

export const createUserResponse = z.object({
  userId: z.string(),
  username: z.string(),
  authToken: z.string(),
  name: z.string().nullish(),
  customFields: userCustomField.array().optional(),
  redirectUrl: z.string().optional(),
});

export type CreateUserResponse = z.infer<typeof createUserResponse>;

export const publicSurveyEntry = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  localeId: z.string(),
  originatingUrl: z.string().nullable(),
  supportEmail: z.string(),
  openAccess: z.boolean(),
  authCaptcha: z.boolean(),
});

export type PublicSurveyEntry = z.infer<typeof publicSurveyEntry>;

export const surveyEntryResponse = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  state: z.enum(surveyStatuses),
  locale: z.object({
    id: z.string(),
    code: z.string(),
    splitWords: z.string().array(),
  }),
  surveyScheme: z.object({
    id: z.string(),
    settings: schemeSettings,
    meals: meal.array(),
    prompts: groupedRecallPrompts,
  }),
  feedbackScheme: feedbackSchemeResponse.optional(),
  faqs: z.boolean(),
  numberOfSubmissionsForFeedback: z.number(),
  session: sessionSettings,
  suspensionReason: z.string().nullable(),
  searchSortingAlgorithm: z.enum(searchSortingAlgorithms),
  searchMatchScoreWeight: z.number(),
});

export type SurveyEntryResponse = z.infer<typeof surveyEntryResponse>;
export type SchemeEntryResponse = SurveyEntryResponse['surveyScheme'];

export const surveyUserInfoResponse = z.object({
  userId: z.string().openapi({ title: 'Internal (numerical) Intake24 user ID' }),
  name: z.string().nullable().openapi({
    title: 'Optional user name for personalization',
  }),
  customFields: z.record(z.string()).openapi({
    description: 'Public user custom fields',
  }),
  submissions: z.number().openapi({ description: 'Number of collected submissions' }),
  showFeedback: z.boolean().openapi({ description: 'Whether to show feedback' }),
  maximumTotalSubmissionsReached: z.boolean().openapi({
    description: 'Whether the user has reached the maximum number of submissions',
  }),
  maximumDailySubmissionsReached: z.boolean().openapi({
    description: 'Whether the user has reached the maximum number of submissions per day',
  }),
  followUpUrl: z
    .union([z.string(), z.record(z.string())])
    .nullish()
    .openapi({ description: 'Optional follow-up URL for user redirect' }),
});

export type SurveyUserInfoResponse = z.infer<typeof surveyUserInfoResponse>;

export const surveySubmissionResponse = surveyUserInfoResponse.extend({
  submission: z.object({ id: z.string(), submissionTime: z.date() }),
});

export type SurveySubmissionResponse = z.infer<typeof surveySubmissionResponse>;

export const surveyUserSessionResponse = z.object({
  userId: z.string(),
  surveyId: z.string(),
  sessionData: z.any(),
});

export type SurveyUserSessionResponse = z.infer<typeof surveyUserSessionResponse>;

export const surveyFAQs = faqSection.array();
export type SurveyFAQs = z.infer<typeof surveyFAQs>;

export const surveyHelpRequest = z
  .object({
    name: z.string().nullish(),
    email: z.string().email().toLowerCase().nullish(),
    phone: z.string().nullish(),
    phoneCountry: z
      .string()
      .nullish()
      .refine(value => (value ? isIn(value, getSupportedRegionCodes()) : true)),
    message: z.string().max(500).nullish(),
  })
  .refine(
    (data) => {
      if (!data.phone)
        return true;

      return parsePhoneNumber(data.phone, { regionCode: data.phoneCountry ?? undefined }).valid;
    },
    {
      message: 'Invalid phone format',
      path: ['phone'],
    },
  )
  .transform((data) => {
    if (!data.phone || !data.phoneCountry)
      return data;

    const phoneNumber = parsePhoneNumber(data.phone, { regionCode: data.phoneCountry });
    if (!phoneNumber.valid)
      return data;

    return { ...data, phone: phoneNumber.number.international };
  });

export type SurveyHelpRequest = z.infer<typeof surveyHelpRequest>;

export const surveyRatingRequest = z.object({
  type: z.enum(surveyRatings),
  rating: z.number().min(1).max(5),
  submissionId: z.string().uuid().optional(),
  comment: z.string().max(500).nullish(),
});

export type SurveyRatingRequest = z.infer<typeof surveyRatingRequest>;
