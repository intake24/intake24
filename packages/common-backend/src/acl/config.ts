import { z } from 'zod';

import { msStringValue, validateConfig } from '../util';

export const aclConfigSchema = z.object({
  cache: z.object({
    enabled: z.boolean().or(z.stringbool()).default(false),
    ttl: msStringValue.default('7d'),
  }),
  roles: z.object({
    superuser: z.string().default('superuser'),
  }),
  signup: z.object({
    enabled: z.boolean().or(z.stringbool()).default(false),
    permissions: z.string().default('').transform(val => val ? val.split(',') : []),
    roles: z.string().default('').transform(val => val ? val.split(',') : []),
  }),
});
export type ACLConfig = z.infer<typeof aclConfigSchema>;

export const rawAclConfig = {
  cache: {
    enabled: process.env.ACL_CACHE_ENABLED,
    ttl: process.env.ACL_CACHE_TTL,
  },
  roles: {
    superuser: 'superuser',
  },
  signup: {
    enabled: process.env.ACL_SIGNUP_ENABLED,
    permissions: process.env.ACL_SIGNUP_PERMISSIONS,
    roles: process.env.ACL_SIGNUP_ROLES,
  },
};

export const aclConfig = validateConfig('ACL configuration', aclConfigSchema, rawAclConfig);
export default aclConfig;
