import ms from 'ms';
import z from 'zod';
import { mfaModes } from '@intake24/common/security';
import { parseToMs } from '@intake24/common/util';
import { cookieSettings, msStringValue } from './common';
import { validateConfig } from './validate-config';

export const jwtFrontEndSettings = z.object({
  access: z.object({
    lifetime: msStringValue,
    audience: z.custom<[string, ...string[]]>(() => z.array(z.string()).min(1)),
  }),
  refresh: z.object({
    secret: z.string(),
    lifetime: msStringValue,
    audience: z.custom<[string, ...string[]]>(() => z.array(z.string()).min(1)),
  }),
  cookie: cookieSettings,
});
export type JwtFrontEndSettings = z.infer<typeof jwtFrontEndSettings>;

export const securityConfigSchema = z.object({
  cors: z.object({
    origin: z.union([z.boolean(), z.string(), z.array(z.string())]).default(false),
  }),
  proxy: z.union([z.array(z.string()), z.boolean()]).default(false),
  jwt: z.object({
    issuer: z.string().min(1).default('intake24'),
    secret: z.string().min(32),
    admin: jwtFrontEndSettings,
    survey: jwtFrontEndSettings,
  }),
  mfa: z.object({
    mode: z.enum(mfaModes).default('optional'),
    compat: z.coerce.date().nullable().default(null),
    providers: z.object({
      duo: z.object({
        clientId: z.string().default(''),
        clientSecret: z.string().default(''),
        apiHost: z.string().default(''),
        redirectUrl: z.string().url().default('https://localhost:8100'),
      }),
      fido: z.object({
        issuer: z.string().min(1).default('intake24'),
      }),
      otp: z.object({
        issuer: z.string().min(1).default('intake24'),
      }),
    }),
  }),
  passwords: z.object({
    expiresIn: msStringValue.default('1h'),
  }),
  authTokens: z.object({
    size: z.coerce.number().int().min(32).default(32),
    alphabet: z.string().min(1).optional(),
  }),
  signInLog: z.object({
    enabled: z.boolean().default(true),
  }),
});
export type SecurityConfig = z.infer<typeof securityConfigSchema>;

const rawSecurityConfig = {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false,
  },
  proxy: process.env.PROXY ? process.env.PROXY.split(',') : false,
  jwt: {
    issuer: process.env.JWT_ISSUER,
    secret: process.env.JWT_ACCESS_SECRET,
    admin: {
      access: {
        audience: ['admin', 'access'],
        lifetime: process.env.JWT_ADMIN_ACCESS_LIFETIME || '15m',
      },
      refresh: {
        audience: ['admin', 'refresh'],
        secret: process.env.JWT_ADMIN_REFRESH_SECRET,
        lifetime: process.env.JWT_ADMIN_REFRESH_LIFETIME || '1d',
      },
      cookie: {
        name: 'it24a_refresh_token',
        maxAge: ms(parseToMs(process.env.JWT_ADMIN_REFRESH_LIFETIME) || '1d'),
        httpOnly: true,
        path: process.env.JWT_ADMIN_COOKIE_PATH || '/api/admin/auth',
        sameSite: process.env.JWT_ADMIN_COOKIE_SAMESITE,
        secure: process.env.JWT_ADMIN_COOKIE_SECURE === 'true',
      },
    },
    survey: {
      access: {
        audience: ['survey', 'access'],
        lifetime: process.env.JWT_SURVEY_ACCESS_LIFETIME || '15m',
      },
      refresh: {
        audience: ['survey', 'refresh'],
        secret: process.env.JWT_SURVEY_REFRESH_SECRET ?? '',
        lifetime: process.env.JWT_SURVEY_REFRESH_LIFETIME || '1d',
      },
      cookie: {
        name: 'it24s_refresh_token',
        maxAge: ms(parseToMs(process.env.JWT_SURVEY_REFRESH_LIFETIME) || '1d'),
        httpOnly: true,
        path: process.env.JWT_SURVEY_COOKIE_PATH || '/api/auth',
        sameSite: process.env.JWT_SURVEY_COOKIE_SAMESITE,
        secure: process.env.JWT_SURVEY_COOKIE_SECURE === 'true',
      },
    },
  },
  mfa: {
    mode: process.env.MFA_MODE,
    compat: process.env.MFA_COMPAT_DATE,
    providers: {
      duo: {
        clientId: process.env.DUO_CLIENT_ID,
        clientSecret: process.env.DUO_CLIENT_SECRET,
        apiHost: process.env.DUO_API_HOST,
        redirectUrl: process.env.DUO_REDIRECT_URL,
      },
      fido: {
        issuer: process.env.FIDO_ISSUER,
      },
      otp: {
        issuer: process.env.OTP_ISSUER,
      },
    },
  },
  passwords: {
    expiresIn: process.env.PASSWORDS_EXPIRES_IN,
  },
  authTokens: {
    size: process.env.AUTH_TOKENS_SIZE,
    alphabet: process.env.AUTH_TOKENS_ALPHABET,
  },
  signInLog: {
    enabled: !process.env.SIGN_IN_LOG_ENABLED || process.env.SIGN_IN_LOG_ENABLED === 'true',
  },
};

const parsedSecurityConfig = validateConfig('Security configuration', securityConfigSchema, rawSecurityConfig);

export default parsedSecurityConfig;
