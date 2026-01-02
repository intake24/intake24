import type { PublicSurveyEntry } from '@intake24/common/types/http';
import type { Survey } from '@intake24/db';

export function publicSurveyEntryResponse(survey: Survey): PublicSurveyEntry {
  const {
    id,
    slug,
    name,
    localeId,
    originatingUrl,
    supportEmail,
    genUserKey,
    allowGenUsers,
    authCaptcha,
    authModes,
  } = survey;

  return {
    id,
    slug,
    name,
    localeId,
    originatingUrl,
    supportEmail,
    openAccess: allowGenUsers && !genUserKey,
    authCaptcha,
    authModes,
  };
}
