import { z } from 'zod';

export const mfaModes = ['optional', 'required'] as const;
export type MFAMode = (typeof mfaModes)[number];

export const mfaProviders = ['fido', 'otp', 'code', 'duo'] as const;
export type MFAProvider = (typeof mfaProviders)[number];

export function isMFAProvider(provider: any): provider is MFAProvider {
  return mfaProviders.includes(provider);
}

export const baseChallenge = z.object({
  challengeId: z.string(),
  deviceId: z.string(),
});
export type BaseChallenge = z.infer<typeof baseChallenge>;

export const duoAuthChallenge = baseChallenge.extend({
  provider: z.literal('duo'),
  challengeUrl: z.url(),
});
export type DuoAuthChallenge = z.infer<typeof duoAuthChallenge>;

// import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';
export const publicKeyCredentialDescriptorJSON = z.object({
  challenge: z.string(),
  timeout: z.number().optional(),
  rpId: z.string().optional(),
  allowCredentials:
    z.object({
      id: z.string(),
      type: z.literal('public-key'),
      transports: z.enum(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']).array().optional(),
    })
      .array()
      .optional(),
  userVerification: z.enum(['required', 'preferred', 'discouraged']).optional(),
  hints: z.enum(['hybrid', 'security-key', 'client-device']).array().optional(),
  extensions: z.object({
    appid: z.string().optional(),
    credProps: z.boolean().optional(),
    hmacCreateSecret: z.boolean().optional(),
    minPinLength: z.boolean().optional(),
  }).optional(),
});
export type PublicKeyCredentialDescriptorJSON = z.infer<
  typeof publicKeyCredentialDescriptorJSON
>;

export const fidoAuthChallenge = baseChallenge.extend({
  provider: z.literal('fido'),
  options: publicKeyCredentialDescriptorJSON,
});
export type FIDOAuthChallenge = z.infer<typeof fidoAuthChallenge>;

export const otpAuthChallenge = baseChallenge.extend({
  provider: z.literal('otp'),
});
export type OTPAuthChallenge = z.infer<typeof otpAuthChallenge>;

export const codeAuthChallenge = baseChallenge.extend({
  provider: z.literal('code'),
});
export type CodeAuthChallenge = z.infer<typeof codeAuthChallenge>;

export const mfaAuthChallenge = z.union([duoAuthChallenge, fidoAuthChallenge, otpAuthChallenge, codeAuthChallenge]);
export type MFAAuthChallenge = z.infer<typeof mfaAuthChallenge>;
