import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';

export const mfaModes = ['optional', 'required'] as const;
export type MFAMode = (typeof mfaModes)[number];

export const mfaProviders = ['duo', 'fido', 'otp'] as const;
export type MFAProvider = (typeof mfaProviders)[number];

export function isMFAProvider(provider: any): provider is MFAProvider {
  return mfaProviders.includes(provider);
}

export type MFAVerifyCredentials = {
  deviceId: string;
  userId: string;
  token: string;
};

export type DuoAuthChallenge = {
  challengeId: string;
  deviceId: string;
  provider: 'duo';
  challengeUrl: string;
};

export type FIDOAuthChallenge = {
  challengeId: string;
  deviceId: string;
  provider: 'fido';
  options: PublicKeyCredentialRequestOptionsJSON;
};

export type OTPAuthChallenge = { challengeId: string; deviceId: string; provider: 'otp' };

export type MFAAuthChallenge = DuoAuthChallenge | FIDOAuthChallenge | OTPAuthChallenge;
