# Mail

Path: `packages/common-backend/src/services/mailer/config.ts`

Mail implementation supports following transports:

- `SMTP` - SMTP protocol
- `Log` - logs messages to `stdout` (for debugging purposes)

Implementation is using [nodemailer](https://nodemailer.com).

## Mailer

Selected mailer transport

- object-path: `mailer`
- dotenv var: `MAIL_MAILER`
- type: `'smtp' | 'log'`
- default: `'log'`

## SMTP transport

### Host

- object-path: `mailers.smtp.host`
- dotenv var: `MAIL_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `mailers.smtp.port`
- dotenv var: `MAIL_PORT`
- type: `number`
- default: `25`

### Secure

- object-path: `mailers.smtp.secure`
- dotenv var: `MAIL_SECURE`
- type: `boolean`
- default: `false`

### ignoreTLS

- object-path: `mailers.smtp.ignoreTLS`
- dotenv var: `MAIL_IGNORE_TLS`
- type: `boolean`
- default: `false`

### Authentication

Authentication is only used when both username and password are set.

#### Username

- object-path: `mailers.smtp.auth.user`
- dotenv var: `MAIL_USERNAME`
- type: `string | null`
- default: `null`

#### Password

- object-path: `mailers.smtp.auth.pass`
- dotenv var: `MAIL_PASSWORD`
- type: `string | null`
- default: `null`

## From

- object-path: `from`

### Address

- object-path: `from.address`
- dotenv var: `MAIL_FROM_ADDRESS`
- type: `string`
- default: `'no-reply@domain.com'`

### Name

- object-path: `from.name`
- dotenv var: `MAIL_FROM_NAME`
- type: `string`
- default: `'Intake24'`

## Reply-To

Email address displayed in email footer as a reply-to address. If reply-to address is not set, reply-to footer will not be included in the email.

- object-path: `replyTo`
- dotenv var: `MAIL_REPLY_TO_ADDRESS`
- type: `string`
- default: `undefined`
