# Services

Path: `apps/api/src/config/services.ts`

## Single Sign-On

System supports Single Sign-On (SSO) using `OpenID Connect`. It is possible to configure
multiple providers.

Refer to your `OpenID Connect` provider documentation for the required configuration values. Usually, you will need to register your application with the provider and obtain a client ID and client secret.

### Issuer

Issuer URL of the OpenID Connect provider to be used for the discovery document / specification.

- object-path: `oidc[provider].issuer`
- dotenv var: `OIDC_{PROVIDER}_ISSUER`
- type: `string`

### Client ID

Client ID of the OpenID Connect provider.

- object-path: `oidc[provider].clientId`
- dotenv var: `OIDC_{PROVIDER}_CLIENT_ID`
- type: `string`

### Client Secret

Client secret of the OpenID Connect provider.

- object-path: `oidc[provider].clientSecret`
- dotenv var: `OIDC_{PROVIDER}_CLIENT_SECRET`
- type: `string`

## CAPTCHA

Password recovery and user generation can be protected by captcha services.

Implemented providers:

- [hCAPTCHA](https://hcaptcha.com)
- [Google reCAPTCHA](https://developers.google.com/recaptcha/intro)

V2 (invisible) version is currently implemented.

### Provider

Captcha provider to use. Captcha will be disabled if left empty.

- object-path: `captcha.provider`
- dotenv var: `CAPTCHA_PROVIDER`
- type: `h-captcha | re-captcha`
- default: `''`

### Secret key

- object-path: `captcha.secret`
- dotenv var: `CAPTCHA_SECRET`
- type: `string`
- default: `''`

## Communications

Provides email communications functionality via third-party providers.

### Provider

Communications provider to use. Communications will be disabled if left empty.

- object-path: `comms.provider`
- dotenv var: `COMMS_PROVIDER`
- type: `string`
- default: `null`

### Email Blaster

Provides email communications via [Email Blaster](https://emailblaster.cloud).

### URL

Base URL for Email Blaster API.

- object-path: `comms.emailBlaster.url`
- dotenv var: `COMMS_EMAIL_BLASTER_URL`
- type: `string`
- default: `'https://api.emailblaster.cloud/2.0'`

#### API key

API key for Email Blaster.

- object-path: `comms.emailBlaster.apiKey`
- dotenv var: `COMMS_EMAIL_BLASTER_API_KEY`
- type: `string`
- default: `''`

#### Newsletter ID

Newsletter list ID for general communications.

- object-path: `comms.emailBlaster.lists.newsletter`
- dotenv var: `COMMS_EMAIL_BLASTER_NEWSLETTER`
- type: `string`
- default: `''`

#### Support ID

Support list ID for support-related communications.

- object-path: `comms.emailBlaster.lists.support`
- dotenv var: `COMMS_EMAIL_BLASTER_SUPPORT`
- type: `string`
- default: `''`

## OpenRouter

LLM access via [OpenRouter](https://openrouter.ai), used by LLM-based services such as [meal description](#meal-description). These services are disabled if the API key is left empty.

### API key

- object-path: `openRouter.apiKey`
- dotenv var: `OPENROUTER_API_KEY`
- type: `string`
- default: `''`

### Base URL

- object-path: `openRouter.baseUrl`
- dotenv var: `OPENROUTER_BASE_URL`
- type: `string`
- default: `'https://openrouter.ai/api/v1'`

## Meal description

Used by the meal description prompt to split free-text meal descriptions into individual foods via [OpenRouter](#openrouter). The service is disabled if the model is left empty.

### Model

OpenRouter model identifier, e.g. `provider/model-name`. The model must support structured outputs (`response_format` with JSON schema).

- object-path: `mealDescription.model`
- dotenv var: `MEAL_DESCRIPTION_MODEL`
- type: `string`
- default: `''`

### Timeout

Maximum time to wait for the model response.

- object-path: `mealDescription.timeout`
- dotenv var: `MEAL_DESCRIPTION_TIMEOUT`
- type: `string` ([ms](https://github.com/vercel/ms) format)
- default: `'30s'`

## Web-push

Provides web-push functionality for supported browsers.

To enable the functionality, VAPID keys has to be generated.

```sh
pnpx web-push generate-vapid-keys
```

### Subject

- object-path: `webPush.subject`
- dotenv var: `WEBPUSH_SUBJECT`
- type: `string`
- default: `''`

### VAPID public key

- object-path: `webPush.publicKey`
- dotenv var: `WEBPUSH_PUBLIC_KEY`
- type: `string`
- default: `''`

### VAPID private key

- object-path: `webPush.privateKey`
- dotenv var: `WEBPUSH_PRIVATE_KEY`
- type: `string`
- default: `''`
