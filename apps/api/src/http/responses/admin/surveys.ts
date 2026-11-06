import type { SurveyEntry, SurveyListEntry } from '@intake24/common/types/http/admin';
import type { Survey } from '@intake24/db';

import { InternalServerError } from '../../errors';

export function surveyListResponse(survey: Survey): SurveyListEntry {
  const {
    id,
    slug,
    name,
    localeId,
    locale,
    surveyScheme,
    surveySchemeId,
    state,
    securables = [],
  } = survey;

  if (!locale || !surveyScheme)
    throw new InternalServerError('surveyListResponse: not loaded relationships.');

  return {
    id,
    slug,
    name,
    localeId,
    surveySchemeId,
    state,
    securables,
    locale,
    surveyScheme,
  };
}

export function surveyResponse(survey: Survey): SurveyEntry {
  const { feedbackScheme, surveyScheme, locale, owner } = survey;

  if (!locale || !surveyScheme)
    throw new InternalServerError('surveyResponse: not loaded relationships.');

  return {
    ...survey.get(),
    startDate: survey.startDate.toISOString(),
    endDate: survey.endDate.toISOString(),
    locale,
    feedbackScheme,
    surveyScheme,
    owner: owner
      ? { id: owner.id, name: owner.name, email: owner.email }
      : undefined,
  };
}
