import type { Pagination } from '../generic';
import type { UserListEntry } from './users';

import { z } from 'zod';

import { bigIntString } from '../generic';
import { userAttributes } from './users';

export const createUserWithSecurables = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().max(512).nullish(),
  phone: z.string().max(32).nullish(),
  actions: z.string().array().min(1),
});

export type CreateUserWithSecurables = z.infer<typeof createUserWithSecurables>;

export const updateSecurableOwnerRequest = z.object({
  userId: bigIntString.nullable(),
});

export type UpdateSecurableOwnerRequest = z.infer<typeof updateSecurableOwnerRequest>;

export const userSecurableAttributes = z.object({
  userId: z.string(),
  securableId: z.string(),
  securableType: z.string(),
  action: z.string(),
  fields: z.string().array().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserSecurableAttributes = z.infer<typeof userSecurableAttributes>;

export const userSecurableListEntry = userAttributes.pick({
  id: true,
  name: true,
  email: true,
}).extend({
  securables: userSecurableAttributes.array(),
});

export type UserSecurableListEntry = z.infer<typeof userSecurableListEntry>;

export type UsersWithSecurablesResponse = Pagination<UserSecurableListEntry>;

export type AvailableUsersWithSecurablesResponse = UserListEntry[];
