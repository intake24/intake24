import type { LanguageEntry } from '@intake24/common/types/http/admin';
import type { Language } from '@intake24/db';

export function languageResponse(language: Language): LanguageEntry {
  const { owner } = language;

  return {
    ...language.get(),
    owner: owner
      ? { id: owner.id, name: owner.name, email: owner.email }
      : undefined,
  };
}
