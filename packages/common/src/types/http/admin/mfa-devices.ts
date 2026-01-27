import { z } from 'zod';

import { mfaProviders } from '@intake24/common/security';

export const mfaDeviceAttributes = z.object({
  id: z.string(),
  userId: z.string(),
  provider: z.enum(mfaProviders),
  name: z.string().max(128),
  secret: z.string().max(128),
  preferred: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MFADeviceAttributes = z.infer<typeof mfaDeviceAttributes>;

export const mfaDeviceResponse = mfaDeviceAttributes.omit({ secret: true });
export type MFADeviceResponse = z.infer<typeof mfaDeviceResponse>;

export const mfaDevicesResponse = z.object({
  status: z.boolean(),
  devices: mfaDeviceResponse.array(),
});

export type MFADevicesResponse = z.infer<typeof mfaDevicesResponse>;

export const duoRegistrationChallenge = z.object({
  challengeId: z.string(),
  challengeUrl: z.string().url(),
});

export type DuoRegistrationChallenge = z.infer<typeof duoRegistrationChallenge>;

export const duoRegistrationVerificationRequest = z.object({
  challengeId: z.string(),
  name: z.string().min(3).max(128),
  token: z.string(),
});
export type DuoRegistrationVerificationRequest = z.infer<typeof duoRegistrationVerificationRequest>;

export const fidoRegistrationChallenge = z.object({
  rp: z.object({
    id: z.string().optional(),
    name: z.string(),
  }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string(),
  }),
  challenge: z.string(),
  pubKeyCredParams: z.array(
    z.object({
      type: z.literal('public-key'),
      alg: z.number(),
    }),
  ),
  timeout: z.number().optional(),
  excludeCredentials: z
    .array(
      z.object({
        id: z.string(),
        type: z.literal('public-key'),
        transports: z.enum(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']).array().optional(),
      }),
    )
    .optional(),
  authenticatorSelection: z
    .object({
      authenticatorAttachment: z.enum(['cross-platform', 'platform']).optional(),
      requireResidentKey: z.boolean().optional(),
      residentKey: z.enum(['discouraged', 'preferred', 'required']).optional(),
      userVerification: z.enum(['discouraged', 'preferred', 'required']).optional(),
    })
    .optional(),
  attestation: z.enum(['none', 'indirect', 'direct', 'enterprise']).optional(),
  extensions: z
    .object({
      appid: z.string().optional(),
      credProps: z.boolean().optional(),
      hmacCreateSecret: z.boolean().optional(),
    })
    .optional(),
});
export type FIDORegistrationChallenge = z.infer<typeof fidoRegistrationChallenge>;

export const registrationResponseJSON = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    attestationObject: z.string(),
    authenticatorData: z.string().optional(),
    transports: z.enum(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']).array().optional(),
    publicKeyAlgorithm: z.number().optional(),
    publicKey: z.string().optional(),
  }),
  authenticatorAttachment: z.enum(['cross-platform', 'platform']).optional(),
  clientExtensionResults: z.object({
    appid: z.boolean().optional(),
    credProps: z.object({
      rk: z.boolean().optional(),
    }).optional(),
    hmacCreateSecret: z.boolean().optional(),
  }),
  type: z.literal('public-key'),
});

export const fidoRegistrationVerificationRequest = z.object({
  challengeId: z.string(),
  name: z.string().min(3).max(128),
  response: registrationResponseJSON,
});
export type FIDORegistrationVerificationRequest = z.infer<
  typeof fidoRegistrationVerificationRequest
>;

export const otpRegistrationChallenge = z.object({
  challengeId: z.string(),
  qrCode: z.string(),
  url: z.string().url(),
});
export type OTPRegistrationChallenge = z.infer<typeof otpRegistrationChallenge>;

export const otpRegistrationVerificationRequest = z.object({
  challengeId: z.string(),
  name: z.string().min(3).max(128),
  token: z.string().length(6),
});
export type OTPRegistrationVerificationRequest = z.infer<typeof otpRegistrationVerificationRequest>;
