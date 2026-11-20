# Services

Path: `apps/api/src/config/services.ts`

## Single Sign-On

System supports Single Sign-On (SSO) using `OpenID Connect`. It is possible to configure
multiple providers.

Each provider is defined by a set of `OIDC_{PROVIDER}_*` variables, e.g. `OIDC_GOOGLE_ISSUER`. Provider name is lower-cased (e.g. `google`).

Enabled providers also have to be listed in [Admin client `VITE_OIDC_PROVIDERS`](/config/admin/#vite-oidc-providers) using the same lower-case names.

:::tip
Use a short single-word provider name. Admin client uses it for the login button label and [Font Awesome](https://fontawesome.com/search?ic=brands) brand icon (`fab fa-{provider}`).
:::

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
- type: `'h-captcha' | 're-captcha' | null`
- default: `null`

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
- type: `'email-blaster' | null`
- default: `null`

### Email Blaster

Provides email communications via [Email Blaster](https://emailblaster.cloud).

#### URL

Base URL for Email Blaster API.

- object-path: `comms['email-blaster'].url`
- dotenv var: `COMMS_EMAIL_BLASTER_URL`
- type: `string`
- default: `'https://api.emailblaster.cloud/2.0'`

#### API key

API key for Email Blaster.

- object-path: `comms['email-blaster'].apiKey`
- dotenv var: `COMMS_EMAIL_BLASTER_API_KEY`
- type: `string`
- default: `''`

#### Newsletter ID

Newsletter list ID for general communications.

- object-path: `comms['email-blaster'].lists.newsletter`
- dotenv var: `COMMS_EMAIL_BLASTER_NEWSLETTER`
- type: `string`
- default: `''`

#### Support ID

Support list ID for support-related communications.

- object-path: `comms['email-blaster'].lists.support`
- dotenv var: `COMMS_EMAIL_BLASTER_SUPPORT`
- type: `string`
- default: `''`

## DeepL

[DeepL](https://www.deepl.com) translation API, used for translations during locale imports.

### API key

- object-path: `deepl.apiKey`
- dotenv var: `DEEPL_API_KEY`
- type: `string`
- default: `''`

### API host

- object-path: `deepl.apiHost`
- dotenv var: `DEEPL_API_HOST`
- type: `string`
- default: `'api-free.deepl.com'`

## Web-push

Provides web-push functionality for supported browsers.

To enable the functionality, VAPID keys has to be generated.

```sh
pnpx web-push generate-vapid-keys
```

### Subject

- object-path: `webPush.subject`
- dotenv var: `WEBPUSH_SUBJECT`
- type: `string` (`mailto:` or `https:` URL, e.g. `mailto:admin@example.com`)
- required

### VAPID public key

- object-path: `webPush.publicKey`
- dotenv var: `WEBPUSH_PUBLIC_KEY`
- type: `string`
- required

### VAPID private key

- object-path: `webPush.privateKey`
- dotenv var: `WEBPUSH_PRIVATE_KEY`
- type: `string`
- required
