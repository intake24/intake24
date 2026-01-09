import { z } from 'zod';
import { mfaAuthChallenge } from '@intake24/common/security';
import { mfaDeviceResponse } from './admin/mfa-devices';

export type LoginRequest = {
  email: string;
  password: string;
};

export type EmailLoginRequest = {
  email: string;
  password: string;
  survey: string;
  captcha?: string;
};

export type AliasLoginRequest = {
  username: string;
  password: string;
  survey: string;
  captcha?: string;
};

export type TokenLoginRequest = {
  token: string;
  captcha?: string;
};

export const loginResponse = z.object({ accessToken: z.string() });
export type LoginResponse = z.infer<typeof loginResponse>;
export const challengeResponse = z.object({ surveyId: z.string(), provider: z.literal('captcha') });
export type ChallengeResponse = z.infer<typeof challengeResponse>;

export const mfaChallengeRequest = z.object({
  challengeId: z.string(),
  deviceId: z.string(),
  userId: z.string(),
});
export type MFAChallengeRequest = z.infer<typeof mfaChallengeRequest>;

export const mfaChallengeResponse = z.object({
  challenge: mfaAuthChallenge.optional(),
  devices: mfaDeviceResponse.array(),
});
export type MFAChallengeResponse = z.infer<typeof mfaChallengeResponse>;

export const adminAuthResponse = z.union([loginResponse, mfaChallengeResponse]);
export type AdminAuthResponse = z.infer<typeof adminAuthResponse>;
export const surveyAuthResponse = z.union([loginResponse, challengeResponse]);
export type SurveyAuthResponse = z.infer<typeof surveyAuthResponse>;

export const otpAuthenticationVerificationRequest = z.object({
  challengeId: z.string(),
  provider: z.literal('otp'),
  token: z.string().length(6),
});
export type OTPAuthenticationVerificationRequest = z.infer<
  typeof otpAuthenticationVerificationRequest
>;

export const duoAuthenticationVerificationRequest = z.object({
  challengeId: z.string(),
  provider: z.literal('duo'),
  token: z.string(),
});
export type DuoAuthenticationVerificationRequest = z.infer<
  typeof duoAuthenticationVerificationRequest
>;

/* validation for  import type { AuthenticationResponseJSON,} from '@simplewebauthn/server'; */
export const authenticationResponseJSON = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    authenticatorData: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  authenticatorAttachment: z
    .union([z.literal('cross-platform'), z.literal('platform')])
    .optional(),
  clientExtensionResults: z.object({
    appid: z.boolean().optional(),
    credProps: z.object({ rk: z.boolean().optional() }).optional(),
    hmacCreateSecret: z.boolean().optional(),
  }),
  type: z.literal('public-key'),
});

export const fidoAuthenticationVerificationRequest = z.object({
  challengeId: z.string(),
  provider: z.literal('fido'),
  response: authenticationResponseJSON,
});
export type FIDOAuthenticationVerificationRequest = z.infer<
  typeof fidoAuthenticationVerificationRequest
>;

export type MFAVerificationRequest
  = | OTPAuthenticationVerificationRequest
    | DuoAuthenticationVerificationRequest
    | FIDOAuthenticationVerificationRequest;

export type RefreshResponse = LoginResponse;
