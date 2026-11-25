# Rate limiter

Path: `apps/api/src/config/rate-limiter.ts`

[Redis](https://redis.io) is used as rate-limiter store driver.

Redis is also used for other parts of system (cache, queue, session), they have separate connection settings, so they can be configured independently if needed.

:::tip Rate limiter time window definition
Time window to track the requests is defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.
:::

## Redis instance

### URL

- object-path: `redis.url`
- dotenv var: `RATE_LIMITER_REDIS_URL | REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- object-path: `redis.host`
- dotenv var: `RATE_LIMITER_REDIS_HOST | REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `redis.port`
- dotenv var: `RATE_LIMITER_REDIS_PORT | REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- object-path: `redis.db`
- dotenv var: `RATE_LIMITER_REDIS_DATABASE | REDIS_DATABASE`
- type: `number`
- default: `0`

### Key prefix

- object-path: `redis.keyPrefix`
- dotenv var: `RATE_LIMITER_REDIS_PREFIX`
- type: `string`
- default: `'it24:rate-limiter:'`

## Limits

Each request is checked against every limit that applies to it, and is rejected with `429 Too Many Requests` when any of them is exceeded.

:::warning Client IP address
Limits counted per client IP address rely on `PROXY` being set correctly when the API runs behind a reverse proxy, see [security settings](./security). If it is not set, all requests appear to come from the proxy address.
:::

### Generic - anonymous

All `/api` requests without a valid access token, counted per client IP address.

Counted: all requests.

#### Window

- object-path: `limits.genericAnonymous.windowMs`
- dotenv var: `RATE_LIMITER_GENERIC_ANONYMOUS_WINDOW`
- type: `string`
- default: `'5m'`

#### Limit

- object-path: `limits.genericAnonymous.limit`
- dotenv var: `RATE_LIMITER_GENERIC_ANONYMOUS_LIMIT`
- type: `number`
- default: `600`

### Generic - survey user

All `/api` requests with a valid survey access token, counted per user. These requests are not counted against the client IP address, so respondents sharing one external IP address do not share a limit.

Counted: all requests.

#### Window

- object-path: `limits.genericSurveyUser.windowMs`
- dotenv var: `RATE_LIMITER_GENERIC_SURVEY_USER_WINDOW`
- type: `string`
- default: `'5m'`

#### Limit

- object-path: `limits.genericSurveyUser.limit`
- dotenv var: `RATE_LIMITER_GENERIC_SURVEY_USER_LIMIT`
- type: `number`
- default: `600`

### Generic - admin user

All `/api` requests with a valid admin access token (including personal access tokens), counted per user.

Counted: all requests.

#### Window

- object-path: `limits.genericAdminUser.windowMs`
- dotenv var: `RATE_LIMITER_GENERIC_ADMIN_USER_WINDOW`
- type: `string`
- default: `'5m'`

#### Limit

- object-path: `limits.genericAdminUser.limit`
- dotenv var: `RATE_LIMITER_GENERIC_ADMIN_USER_LIMIT`
- type: `number`
- default: `1200`

### Login - account & IP

Email (`/api/auth/login`, `/api/admin/auth/login`) and alias (`/api/auth/login/alias`) logins, counted per account and client IP address. Does not apply to requests with a valid device cookie.

Counted: failed requests.

#### Window

- object-path: `limits.loginAccountIp.windowMs`
- dotenv var: `RATE_LIMITER_LOGIN_ACCOUNT_IP_WINDOW`
- type: `string`
- default: `'15m'`

#### Limit

- object-path: `limits.loginAccountIp.limit`
- dotenv var: `RATE_LIMITER_LOGIN_ACCOUNT_IP_LIMIT`
- type: `number`
- default: `5`

### Login - account

Email and alias logins, counted per account regardless of client IP address. Backstop against password guessing from many addresses. When exceeded, logins to the account are blocked from all IP addresses, except from devices with a valid device cookie, to which this limit does not apply.

Counted: failed requests.

#### Window

- object-path: `limits.loginAccount.windowMs`
- dotenv var: `RATE_LIMITER_LOGIN_ACCOUNT_WINDOW`
- type: `string`
- default: `'15m'`

#### Limit

- object-path: `limits.loginAccount.limit`
- dotenv var: `RATE_LIMITER_LOGIN_ACCOUNT_LIMIT`
- type: `number`
- default: `50`

### Login - IP

All logins, including URL token logins (`/api/auth/login/token`), counted per client IP address across all accounts. Does not apply to requests with a valid device cookie.

Counted: failed requests.

#### Window

- object-path: `limits.loginIp.windowMs`
- dotenv var: `RATE_LIMITER_LOGIN_IP_WINDOW`
- type: `string`
- default: `'15m'`

#### Limit

- object-path: `limits.loginIp.limit`
- dotenv var: `RATE_LIMITER_LOGIN_IP_LIMIT`
- type: `number`
- default: `100`

### Login - device

Email and alias logins with a valid device cookie, counted per device cookie. When the limit is exceeded, the device cookie is ignored and the account and IP limits above apply instead.

Counted: failed requests.

#### Window

- object-path: `limits.loginDevice.windowMs`
- dotenv var: `RATE_LIMITER_LOGIN_DEVICE_WINDOW`
- type: `string`
- default: `'15m'`

#### Limit

- object-path: `limits.loginDevice.limit`
- dotenv var: `RATE_LIMITER_LOGIN_DEVICE_LIMIT`
- type: `number`
- default: `10`

### Password reset - account

Password reset requests (`/api/password`), counted per email address.

Counted: successful requests.

#### Window

- object-path: `limits.passwordResetAccount.windowMs`
- dotenv var: `RATE_LIMITER_PASSWORD_RESET_ACCOUNT_WINDOW`
- type: `string`
- default: `'1h'`

#### Limit

- object-path: `limits.passwordResetAccount.limit`
- dotenv var: `RATE_LIMITER_PASSWORD_RESET_ACCOUNT_LIMIT`
- type: `number`
- default: `3`

### Password reset - IP

Password reset requests (`/api/password`), counted per client IP address.

Counted: all requests.

#### Window

- object-path: `limits.passwordResetIp.windowMs`
- dotenv var: `RATE_LIMITER_PASSWORD_RESET_IP_WINDOW`
- type: `string`
- default: `'1h'`

#### Limit

- object-path: `limits.passwordResetIp.limit`
- dotenv var: `RATE_LIMITER_PASSWORD_RESET_IP_LIMIT`
- type: `number`
- default: `20`

### Email verification

Email verification requests (`/api/admin/user/verify`), counted per user.

Counted: successful requests.

#### Window

- object-path: `limits.verify.windowMs`
- dotenv var: `RATE_LIMITER_VERIFY_WINDOW`
- type: `string`
- default: `'5m'`

#### Limit

- object-path: `limits.verify.limit`
- dotenv var: `RATE_LIMITER_VERIFY_LIMIT`
- type: `number`
- default: `1`

### MFA verification

Admin MFA verification (`/api/admin/auth/verify`), counted per user the session's MFA challenge was issued for, regardless of client IP address. Each challenge allows a single attempt, but a successful password login issues a new challenge without counting towards the login limits, so this limit is what restricts MFA code guessing by someone who knows the password. When exceeded, the user cannot complete MFA from any client until the window expires.

Counted: failed requests.

#### Window

- object-path: `limits.mfaVerify.windowMs`
- dotenv var: `RATE_LIMITER_MFA_VERIFY_WINDOW`
- type: `string`
- default: `'15m'`

#### Limit

- object-path: `limits.mfaVerify.limit`
- dotenv var: `RATE_LIMITER_MFA_VERIFY_LIMIT`
- type: `number`
- default: `5`

### Generate user - survey & IP

User generation (`/api/surveys/:slug/generate-user`), counted per survey and client IP address.

Counted: successful requests.

#### Window

- object-path: `limits.generateUserSurveyIp.windowMs`
- dotenv var: `RATE_LIMITER_GENERATE_USER_SURVEY_IP_WINDOW`
- type: `string`
- default: `'5m'`

#### Limit

- object-path: `limits.generateUserSurveyIp.limit`
- dotenv var: `RATE_LIMITER_GENERATE_USER_SURVEY_IP_LIMIT`
- type: `number`
- default: `30`

### Generate user - survey

User generation (`/api/surveys/:slug/generate-user`), counted per survey regardless of client IP address. The same limit applies to every survey.

Counted: successful requests.

#### Window

- object-path: `limits.generateUserSurvey.windowMs`
- dotenv var: `RATE_LIMITER_GENERATE_USER_SURVEY_WINDOW`
- type: `string`
- default: `'1h'`

#### Limit

- object-path: `limits.generateUserSurvey.limit`
- dotenv var: `RATE_LIMITER_GENERATE_USER_SURVEY_LIMIT`
- type: `number`
- default: `240`

### PDF outputs

Feedback `download` and `email` routes (`/api/user/feedback`), counted per user.

Counted: successful requests.

#### Window

- object-path: `limits.feedback.windowMs`
- dotenv var: `RATE_LIMITER_FEEDBACK_WINDOW`
- type: `string`
- default: `'1m'`

#### Limit

- object-path: `limits.feedback.limit`
- dotenv var: `RATE_LIMITER_FEEDBACK_LIMIT`
- type: `number`
- default: `1`

### Survey / feedback ratings

Ratings (`/api/surveys/:slug/rating`), counted per user.

Counted: successful requests.

#### Window

- object-path: `limits.rating.windowMs`
- dotenv var: `RATE_LIMITER_RATING_WINDOW`
- type: `string`
- default: `'15m'`

#### Limit

- object-path: `limits.rating.limit`
- dotenv var: `RATE_LIMITER_RATING_LIMIT`
- type: `number`
- default: `1`

## Device cookie

After a fully completed login (including MFA), the API sets a device cookie (`it24a_device` for admin, `it24s_device` for survey). It grants no access by itself. On later logins to the same account from the same browser, it replaces the account and IP login limits with the device limit, so that failed attempts by others cannot lock the user out. The cookie uses the same path, `SameSite` and `Secure` settings as the refresh token cookie of the respective frontend.

### Lifetime

- object-path: `deviceCookie.maxAge`
- dotenv var: `DEVICE_COOKIE_LIFETIME`
- type: `string`
- default: `'90d'`

### Max entries

Maximum number of accounts remembered by one browser. The oldest entry is replaced when the limit is reached.

- object-path: `deviceCookie.maxEntries`
- dotenv var: `DEVICE_COOKIE_MAX_ENTRIES`
- type: `number`
- default: `5`

## Removed settings

The API refuses to start if any of these variables are set:

| Removed                                                       | Replaced by                                                                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `RATE_LIMITER_GENERIC_WINDOW`, `RATE_LIMITER_GENERIC_LIMIT`   | `RATE_LIMITER_GENERIC_ANONYMOUS_*`, `RATE_LIMITER_GENERIC_SURVEY_USER_*`, `RATE_LIMITER_GENERIC_ADMIN_USER_*`               |
| `RATE_LIMITER_LOGIN_WINDOW`, `RATE_LIMITER_LOGIN_LIMIT`       | `RATE_LIMITER_LOGIN_ACCOUNT_IP_*`, `RATE_LIMITER_LOGIN_ACCOUNT_*`, `RATE_LIMITER_LOGIN_IP_*`, `RATE_LIMITER_LOGIN_DEVICE_*` |
| `RATE_LIMITER_PASSWORD_WINDOW`, `RATE_LIMITER_PASSWORD_LIMIT` | `RATE_LIMITER_PASSWORD_RESET_ACCOUNT_*`, `RATE_LIMITER_PASSWORD_RESET_IP_*`                                                 |
| `RATE_LIMITER_GEN_USER_WINDOW`, `RATE_LIMITER_GEN_USER_LIMIT` | `RATE_LIMITER_GENERATE_USER_SURVEY_IP_*`, `RATE_LIMITER_GENERATE_USER_SURVEY_*`                                             |
