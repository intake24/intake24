import type { UserEntry, UserSecurableListEntry } from '@intake24/common/types/http/admin';
import type { User } from '@intake24/db';

export function userEntryResponse(user: User): UserEntry {
  const { aliases = [], customFields = [], identities = [], permissions = [], roles = [] } = user;

  return {
    ...user.get(),
    aliases,
    customFields,
    identities,
    permissions,
    roles,
  };
}

export function userSecurablesResponse(user: User): UserSecurableListEntry {
  const { id, name, email, securables = [] } = user;

  return { id, name, email, securables };
}
