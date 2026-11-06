import type { LocaleEntry } from '@intake24/common/types/http/admin';
import type { SystemLocale } from '@intake24/db';

export function localeResponse(locale: SystemLocale): LocaleEntry {
  const { owner } = locale;

  return {
    ...locale.get(),
    owner: owner
      ? { id: owner.id, name: owner.name, email: owner.email }
      : undefined,
  };
}
