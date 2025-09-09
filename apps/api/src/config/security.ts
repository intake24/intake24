import type { StringValue } from 'ms';
import type { CookieSettings, SameSiteCookieOptions } from './common';
import ms from 'ms';
import { parseToMs } from '@intake24/common/util';

export type JwtTokenSettings = {
  secret: string;
  lifetime: StringValue;
  audience: [string, ...string[]];
};

export type JwtFrontEndSettings = {
  access: Omit<JwtTokenSettings, 'secret'>;
  refresh: JwtTokenSettings;
  cookie: CookieSettings;
};

export type JwtAuthentication = {
  issuer: string;
  secret: string;
  admin: JwtFrontEndSettings;
  survey: JwtFrontEndSettings;
};

export type DuoProvider = {
  clientId: string;
  clientSecret: string;
  apiHost: string;
  redirectUrl: string;
};

export type FIDOProvider = {
  issuer: string;
};

export type OTPProvider = {
  issuer: string;
};

export type MultiFactorAuthentication = {
  providers: {
    duo: DuoProvider;
    fido: FIDOProvider;
    otp: OTPProvider;
  };
};

export type PasswordsConfig = {
  expiresIn: StringValue;
};

export type AuthTokensConfig = {
  size: number;
  alphabet: string | null;
};

export type SignInLogConfig = {
  enabled: boolean;
};

export interface SecurityConfig {
  cors: {
    origin: boolean | string | string[];
  };
  proxy: string[] | boolean;
  jwt: JwtAuthentication;
  mfa: MultiFactorAuthentication;
  passwords: PasswordsConfig;
  authTokens: AuthTokensConfig;
  signInLog: SignInLogConfig;
}

const securityConfig: SecurityConfig = {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false,
  },
  proxy: process.env.PROXY ? process.env.PROXY.split(',') : false,
  jwt: {
    issuer: process.env.JWT_ISSUER ?? 'intake24',
    secret: process.env.JWT_ACCESS_SECRET ?? '',
    admin: {
      access: {
        audience: ['admin', 'access'],
        lifetime: parseToMs(process.env.JWT_ADMIN_ACCESS_LIFETIME) || '15m',
      },
      refresh: {
        audience: ['admin', 'refresh'],
        secret: process.env.JWT_ADMIN_REFRESH_SECRET ?? '',
        lifetime: parseToMs(process.env.JWT_ADMIN_REFRESH_LIFETIME) || '1d',
      },
      cookie: {
        name: 'it24a_refresh_token',
        maxAge: ms(parseToMs(process.env.JWT_ADMIN_REFRESH_LIFETIME) || '1d'),
        httpOnly: true,
        path: process.env.JWT_ADMIN_COOKIE_PATH || '/api/admin/auth',
        sameSite: (process.env.JWT_ADMIN_COOKIE_SAMESITE || 'lax') as SameSiteCookieOptions,
        secure: process.env.JWT_ADMIN_COOKIE_SECURE === 'true',
      },
    },
    survey: {
      access: {
        audience: ['survey', 'access'],
        lifetime: parseToMs(process.env.JWT_SURVEY_ACCESS_LIFETIME) || '15m',
      },
      refresh: {
        audience: ['survey', 'refresh'],
        secret: process.env.JWT_SURVEY_REFRESH_SECRET ?? '',
        lifetime: parseToMs(process.env.JWT_SURVEY_REFRESH_LIFETIME) || '1d',
      },
      cookie: {
        name: 'it24s_refresh_token',
        maxAge: ms(parseToMs(process.env.JWT_SURVEY_REFRESH_LIFETIME) || '1d'),
        httpOnly: true,
        path: process.env.JWT_SURVEY_COOKIE_PATH || '/api/auth',
        sameSite: (process.env.JWT_SURVEY_COOKIE_SAMESITE || 'lax') as SameSiteCookieOptions,
        secure: process.env.JWT_SURVEY_COOKIE_SECURE === 'true',
      },
    },
  },
  mfa: {
    providers: {
      duo: {
        clientId: process.env.DUO_CLIENT_ID || '',
        clientSecret: process.env.DUO_CLIENT_SECRET || '',
        apiHost: process.env.DUO_API_HOST || '',
        redirectUrl: process.env.DUO_REDIRECT_URL || '',
      },
      fido: {
        issuer: process.env.FIDO_ISSUER ?? 'intake24',
      },
      otp: {
        issuer: process.env.OTP_ISSUER ?? 'intake24',
      },
    },
  },
  passwords: {
    expiresIn: parseToMs(process.env.PASSWORDS_EXPIRES_IN) || '1h',
  },
  authTokens: {
    size: Number.parseInt(process.env.AUTH_TOKENS_SIZE || '32', 10),
    alphabet: process.env.AUTH_TOKENS_ALPHABET || null,
  },
  signInLog: {
    enabled: !process.env.SIGN_IN_LOG_ENABLED || process.env.SIGN_IN_LOG_ENABLED === 'true',
  },
};

export default securityConfig;
