import validator from 'validator';
import { z } from 'zod';

import { safeIdentifier } from '../generic';
import { permissionAttributes } from './permissions';

export const roleAttributes = z.object({
  id: z.string(),
  name: safeIdentifier.max(128),
  displayName: z.string().min(1).max(128),
  description: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RoleAttributes = z.infer<typeof roleAttributes>;

export const roleRequest = roleAttributes.pick({
  name: true,
  displayName: true,
  description: true,
}).extend({
  permissions: z.string().refine(value => validator.isInt(value)).array(),
});
export type RoleRequest = z.infer<typeof roleRequest>;

export const roleEntry = roleAttributes.extend({
  permissions: permissionAttributes.array(),
});
export type RoleEntry = z.infer<typeof roleEntry>;

export const roleRefs = z.object({
  permissions: permissionAttributes.pick({ id: true, name: true, displayName: true }).array(),
});
export type RoleRefs = z.infer<typeof roleRefs>;
