import type { SiteUrls } from '@intake24/api/config';
import type {
  RespondentEntry,
  RespondentListEntry,
} from '@intake24/common/types/http/admin';
import type { UserSurveyAlias } from '@intake24/db';

import surveyUrlService from '@intake24/api/services/survey/survey-url.service';

export function respondentResponse(urls: SiteUrls, surveySlug: string, authUrlDomainOverride?: string | null) {
  const urlService = surveyUrlService(urls, surveySlug, authUrlDomainOverride);

  const list = (alias: UserSurveyAlias): RespondentListEntry => {
    const { id, userId, username, surveyId, urlAuthToken } = alias;

    return {
      id,
      userId,
      surveyId,
      username,
      urlAuthToken,
      surveyAuthUrl: urlService.getSurveyUrl(urlAuthToken),
      feedbackAuthUrl: urlService.getFeedbackUrl(urlAuthToken),
    };
  };

  const entry = (alias: UserSurveyAlias): RespondentEntry => {
    const {
      id,
      userId,
      username,
      surveyId,
      urlAuthToken,
      user: { name = null, email = null, phone = null, customFields = [] } = {},
    } = alias;

    return {
      id,
      userId,
      surveyId,
      username,
      urlAuthToken,
      name,
      email,
      phone,
      customFields,
      surveyAuthUrl: urlService.getSurveyUrl(urlAuthToken),
      feedbackAuthUrl: urlService.getFeedbackUrl(urlAuthToken),
    };
  };

  return { list, entry };
}

export type RespondentResponse = ReturnType<typeof respondentResponse>;
