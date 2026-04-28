import { parsePhoneNumber } from 'awesome-phonenumber';
import z from 'zod';

export const adminUserProfile = z.object({
  profile: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.email(),
    phone: z.string().nullable(),
    mfa: z.boolean(),
  }),
  aal: z.boolean(),
  permissions: z.array(z.string()),
  roles: z.array(z.string()),
});
export type AdminUserProfile = z.infer<typeof adminUserProfile>;

export const updateUserProfile = z.object({
  name: z.string().max(512).nullish(),
  phone: z.string().max(32).nullish().refine(value => !value || parsePhoneNumber(value).valid, {
    message: 'Invalid phone number',
  }),
});
export type UpdateUserProfile = z.infer<typeof updateUserProfile>;
