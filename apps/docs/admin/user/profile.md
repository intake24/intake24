# Profile

Profile allows user to see the profile information and perform profile-related changes.

## Information

- `email` - user's email address
- `name` - user's name
- `phone` - user's phone number

### Change password

User can change their password by entering the current password and the new password twice.

## Access

- `assigned roles` - list of roles that user was assigned to

- `assigned permissions` - list of permissions that user was granted

## Settings

- `language` - user's preferred language

## Multi-factor authentication

Multi-factor authentication can be set up by adding at least one authentication method and then enabling the multi-factor authentication toggle.

To set up your multi-factor authentication, please log into the admin tool, then click on `Profile` at the top right of the screen. Scroll down to the `Multi-factor authentication` section then click on `Add Device`. From there you can select and set up your preferred method.

Once you have set up your device, you will be able to select the ‘Enable multi-factor authentication’ setting under your Profile page.”

### One-time password (OTP)

One-time password (OTP) authentication method can be set up by installing an authenticator app (e.g. Google Authenticator, MS Authenticator, etc) and scanning the QR code or entering the secret key manually.

### FIDO2 / WebAuthn

Several `FIDO2` / `WebAuthn` authentication methods are available based on user's browser / platform support:

- hardware security key (e.g. YubiKey)

- platform `passkey` authentication flows (e.g. Windows Hello on Windows, Touch ID / Face ID on macOS / iOS)

### Duo Security

Optionally, [Duo Security](https://duo.com) can be used as a multi-factor authentication provider. Intake24 supports [Universal Prompt](https://duo.com/docs/duoweb) authentication method.

Please check that relevant intake24 instance has this option available, configured and that user is enrolled in Duo Security.

:::tip To set up Duo Security as a multi-factor authentication provider:

- create Web SDK application in Duo Security admin panel

- configure intake24 to use [Duo Security as an authentication provider](/config/api/security#duo-provider-settings)

- user's `email` is passed to Duo Security as a primary identifier -> Duo user accounts need to hold the email as primary identifier or as an additional alias
  :::
