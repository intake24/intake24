import type { FeedbackSchemeEntry } from '@intake24/common/types/http/admin';
import type { FeedbackScheme } from '@intake24/db';

export function feedbackSchemeResponse(feedbackScheme: FeedbackScheme): FeedbackSchemeEntry {
  const { owner } = feedbackScheme;

  return {
    ...feedbackScheme.get(),
    owner: owner
      ? { id: owner.id, name: owner.name, email: owner.email }
      : undefined,
  };
}
