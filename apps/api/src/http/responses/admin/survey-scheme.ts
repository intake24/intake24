import type { SurveySchemeEntry } from '@intake24/common/types/http/admin';
import type { SurveyScheme } from '@intake24/db';

export function surveySchemeResponse(surveyScheme: SurveyScheme): SurveySchemeEntry {
  const { owner } = surveyScheme;

  return {
    ...surveyScheme.get(),
    owner: owner
      ? { id: owner.id, name: owner.name, email: owner.email }
      : undefined,
  };
}
