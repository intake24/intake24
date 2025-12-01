# Services

Path: `apps/api/src/config/services.ts`

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
