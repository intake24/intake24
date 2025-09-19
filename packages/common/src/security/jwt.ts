import type { MFAProvider } from './mfa';

export type SubjectProvider = 'email' | 'surveyAlias' | 'URLToken';

export type Subject = {
  provider: SubjectProvider | MFAProvider;
  providerKey: string;
};

export type Amr = 'pwd' | MFAProvider;
export type AmrMethod = { method: Amr; timestamp: number };

export function createAmrMethod(amr: Amr): AmrMethod {
  return { method: amr, timestamp: Math.round(Date.now() / 1000) };
}

export type BaseSignPayload = {
  userId: string;
  verified?: boolean;
  permissions?: string[];
  aal?: 'aal1' | 'aal2';
  amr?: AmrMethod[];
};

export type AdminSignPayload = BaseSignPayload;

export type SurveySignPayload = BaseSignPayload & {
  surveyId: string;
};

export type SignPayload = AdminSignPayload | SurveySignPayload;

export type BaseSignedPayload = {
  sub: string;
  jti: string;
  aud: string | string[];
  iss: string;
  iat: number;
  exp: number;
  aal: 'aal1' | 'aal2';
};

export type AdminTokenPayload = BaseSignedPayload & AdminSignPayload;

export type SurveyTokenPayload = BaseSignedPayload & SurveySignPayload;

export type TokenPayload = AdminTokenPayload | SurveyTokenPayload;
