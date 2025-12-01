# Security

Path: `apps/api/src/config/security.ts`

## Cross-origin resource sharing (CORS)

### CORS Origin

Single origin or list of origins to allow cross-origin resource sharing. Define these, when SPA applications (`Admin client` and `Survey client`) are deployed to different domain than `API server`.

- object-path: `cors.origin`
- dotenv var: `CORS_ORIGIN` (for list of origins, use `comma-delimited` string)
- type: `string | string[] | boolean`
- default: `false`

## Proxy

List of trusted proxies. It allows to define list proxies if application is behind multiple reverse proxies / load balancers.

Since application is usually at least behind local reverse proxy, set as `loopback` (which translates to `127.0.0.1 / ::1`).

- object-path: `proxy`
- dotenv var: `PROXY` (`comma-delimited` string list)
- type: `string[] | boolean`
- default: `false`

## JSON web tokens

JSON web tokens (`JWT`) settings

### Issuer

Issuer claim for signing JWT tokens

- object-path: `jwt.issuer`
- dotenv var: `JWT_ISSUER`
- type: `string`
- default: `'intake24'`

### Access token secret

Secret to sign JWT access token.

You need to set a secret manually or use the [CLI](/cli/generate-key) to generate a secret.

- object-path: `jwt.access.secret`
- dotenv var: `JWT_ACCESS_SECRET`
- type: `string`

### Admin application settings

JWT settings for admin frontend application.

#### Access token audience

Audience claim to sign JWT access token

- object-path: `jwt.admin.access.audience`
- type: `string[]`
- default: `['admin', 'access']`

#### Access token lifetime

Lifetime of JWT access token. Defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `jwt.admin.access.lifetime`
- dotenv var: `JWT_ADMIN_ACCESS_LIFETIME`
- type: `string`
- default: `'15m'`

#### Refresh token secret

Secret to sign JWT refresh token

You need to set a secret manually or use the [CLI](/cli/generate-key) to generate a secret.

- object-path: `jwt.admin.refresh.secret`
- dotenv var: `JWT_ADMIN_REFRESH_SECRET`
- type: `string`

#### Refresh token audience

Audience claim to sign JWT refresh token

- object-path: `jwt.admin.refresh.audience`
- type: `string[]`
- default: `['admin', 'refresh']`

#### Refresh token lifetime

Lifetime of JWT refresh token. Defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `jwt.admin.refresh.lifetime`
- dotenv var: `JWT_ADMIN_REFRESH_LIFETIME`
- type: `string`
- default: `'1d'`

#### JWT Refresh token cookie

Refresh token is stored in `http-only` cookie in client's browser. There are several properties to configure refresh token cookie.

#### Cookie name

- object-path: `jwt.admin.cookie.name`
- type: `string`
- default: `it24a_refresh_token`

#### Cookie maxAge

Lifetime of cookie. Defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `jwt.admin.cookie.maxAge`
- default: `jwt.admin.refresh.lifetime` value
- type: `string`

#### Cookie httpOnly

- object-path: `jwt.admin.cookie.httpOnly`
- type: `boolean`
- default: `true`

#### Cookie path

- object-path: `jwt.admin.cookie.path`
- dotenv var: `JWT_ADMIN_COOKIE_PATH`
- type: `string`
- default: `'/api/admin/auth'`

#### Cookie sameSite

- object-path: `jwt.admin.cookie.sameSite`
- dotenv var: `JWT_ADMIN_COOKIE_SAMESITE`
- type: `boolean | 'lax' | 'strict' | 'none'`
- default: `'lax'`

#### Cookie secure

- object-path: `jwt.admin.cookie.secure`
- dotenv var: `JWT_ADMIN_COOKIE_SECURE`
- type: `boolean`
- default: `false`

### Survey application settings

JWT settings for survey frontend application.

#### Access token audience

Audience claim to sign JWT access token

- object-path: `jwt.survey.access.audience`
- type: `string[]`
- default: `['survey', 'access']`

#### Access token lifetime

Lifetime of JWT access token. Defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `jwt.survey.access.lifetime`
- dotenv var: `JWT_SURVEY_ACCESS_LIFETIME`
- type: `string`
- default: `'15m'`

#### Refresh token secret

Secret to sign JWT refresh token

You need to set a secret manually or use the [CLI](/cli/generate-key) to generate a secret.

- object-path: `jwt.survey.refresh.secret`
- dotenv var: `JWT_SURVEY_REFRESH_SECRET`
- type: `string`

#### Refresh token audience

Audience claim to sign JWT refresh token

- object-path: `jwt.survey.refresh.audience`
- type: `string[]`
- default: `['survey', 'refresh']`

#### Refresh token lifetime

Lifetime of JWT refresh token. Defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `jwt.survey.refresh.lifetime`
- dotenv var: `JWT_SURVEY_REFRESH_LIFETIME`
- type: `string`
- default: `'1d'`

#### JWT Refresh token cookie

Refresh token is stored in `http-only` cookie in client's browser. There are several properties to configure refresh token cookie.

#### Cookie name

- object-path: `jwt.survey.cookie.name`
- type: `string`
- default: `it24s_refresh_token`

#### Cookie maxAge

Lifetime of cookie. Defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `jwt.survey.cookie.maxAge`
- default: `jwt.survey.refresh.lifetime` value
- type: `string`

#### Cookie httpOnly

- object-path: `jwt.survey.cookie.httpOnly`
- type: `boolean`
- default: `true`

#### Cookie path

- object-path: `jwt.survey.cookie.path`
- dotenv var: `JWT_SURVEY_COOKIE_PATH`
- type: `string`
- default: `'/api/auth'`

#### Cookie sameSite

- object-path: `jwt.survey.cookie.sameSite`
- dotenv var: `JWT_SURVEY_COOKIE_SAMESITE`
- type: `boolean | 'lax' | 'strict' | 'none'`
- default: `'lax'`

#### Cookie secure

- object-path: `jwt.survey.cookie.secure`
- dotenv var: `JWT_SURVEY_COOKIE_SECURE`
- type: `boolean`
- default: `false`

## Multi-factor authentication

System supports multi-factor authentication (`MFA`) for admin login.

#### Mode

Mode of MFA enforcement:

- object-path: `mfa.mode`
- dotenv var: `MFA_MODE`
- type: `optional | required`
- default: `optional`

### Compatibility date

Compatibility date cut-off for personal access tokens.

- if set to a date (e.g. `2025-01-01`) and user has personal access tokens issued before this date, they will be allowed to pass authentication
- if set to `null`, no cut-off is applied for personal access tokens and user needs to issue new tokens with MFA enabled

- object-path: `mfa.compat`
- dotenv var: `MFA_COMPAT_DATE`
- type: `string | null`
- default: `null`

Supported providers:

- OTP (one-time password) - any TOTP-compatible app, e.g. Google Authenticator, Authy, etc.
- WebAuthn (FIDO2) - any FIDO2-compatible device, e.g. YubiKey, built-in platform authenticator (e.g. Windows Hello, Apple Touch ID), passkeys, etc.
- [Duo Security](https://duo.com)

User can add multiple MFA providers to their account.

### Duo provider settings

For more information, check out [duo's documentation for WebSDK](https://duo.com/docs/duoweb). Intake24 implements Universal Prompt flow.

#### Duo client ID

Duo client ID - can be found in Duo administration

- object-path: `mfa.providers.duo.clientId`
- dotenv var: `DUO_CLIENT_ID`
- type: `string`
- default: `''`

#### Duo client secret

Duo client secret - can be found in Duo administration

- object-path: `mfa.providers.duo.clientSecret`
- dotenv var: `DUO_CLIENT_SECRET`
- type: `string`
- default: `''`

#### Duo API host

Duo API hostname (e.g. api-a1b2c3d4e5.duosecurity.com) - can be found in Duo administration

- object-path: `mfa.providers.duo.apiHost`
- dotenv var: `DUO_API_HOST`
- type: `string`
- default: `''`

#### Duo redirect URL

URL where to redirect from MFA verification step. This should be admin tool login page.

- object-path: `mfa.providers.duo.redirectUrl`
- dotenv var: `DUO_REDIRECT_URL`
- type: `string`
- default: `''`

## Passwords

Settings for password restore functionality.

### Expire

Password reset link expiration in **minutes**.

- object-path: `passwords.expire`
- dotenv var: `PASSWORDS_EXPIRES_IN`
- type: `string`
- default: `'1h'`

## Authentication tokens

Settings for generation of random authentication tokens.

### Size

Size of the tokens - string's length.

- object-path: `authTokens.size`
- dotenv var: `AUTH_TOKENS_SIZE`
- type: `number`
- default: `32`

### Alphabet

String of custom alphabet - character set to be used for token generation.

- object-path: `authTokens.alphabet`
- dotenv var: `AUTH_TOKENS_ALPHABET`
- type: `string | null`
- default: `null`

## Sign-in logging

Settings for sign-in logging.

### Enabled

Enable/disable database logging of sign-in attempts.

- object-path: `signInLog.enabled`
- dotenv var: `SIGN_IN_LOG_ENABLED`
- type: `boolean`
- default: `true`
