import z from 'zod';

export const adminUserProfile = z.object({
  profile: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    phone: z.string().nullable(),
    mfa: z.boolean(),
  }),
  aal: z.boolean(),
  permissions: z.array(z.string()),
  roles: z.array(z.string()),
});
export type AdminUserProfile = z.infer<typeof adminUserProfile>;
