# Job types

Jobs types available in system.

- [Job types](#job-types)
  - [CleanRedisStore](#cleanredisstore)
  - [CleanStorageFiles](#cleanstoragefiles)
  - [FeedbackSchemesSync](#feedbackschemessync)
  - [LanguageTranslationsSync](#languagetranslationssync)
  - [PurgeExpiredTokens](#purgeexpiredtokens)
  - [Resource export](#resource-export)
  - [SurveySchemesSync](#surveyschemessync)
  - [UserPasswordResetNotification](#userpasswordresetnotification)
  - [UserEmailVerificationNotification](#useremailverificationnotification)

## CleanRedisStore

`CleanRedisStore` wipes the specific redis stores. e.g. `cache` or `session`

```json
{
  "store": "cache" | "session"
}
```

## CleanStorageFiles

`CleanStorageFiles` wipes temporary storage files, e.g. `downloads` and `uploads` folders.

```json
{}
```

## FeedbackSchemesSync

`FeedbackSchemesSync` synchronizes existing feedback schemes with default values.

:::tip
This needs to be run if feedback scheme structure changes, e.g. new non-optional properties are added, so all database records are synced to use same structure.
:::

```json
{}
```

## LanguageTranslationsSync

`LanguageTranslationsSync` synchronizes database language translation records with built-in English translation.

:::tip Built-in translations update
This needs to be run if object structure changes, so all database records are synced to use same structure.
:::

```json
{}
```

## PurgeExpiredTokens

`PurgeExpiredTokens` cleans expired `personal access` and `refresh` tokens, that don't need to be hold in database store anymore.

```json
{}
```

## Resource export

`ResourceExport` allows to export specific resource data as CSV-file.

```json
{
  "resource": string,
}
```

**Exportable resources**

- As served sets
- As served set images
- Drinkware sets
- Drinkware set scales
- Drinkware set volumes
- Food groups
- Guide images
- Guide image objects
- Image maps
- Image map objects
- Languages
- Locales
- Nutrient types
- Standard units

## SurveySchemesSync

`SurveySchemesSync` synchronizes existing survey schemes with default values.

:::tip
This needs to be run if survey schemes structure changes, e.g. new non-optional properties are added, so all database records are synced to use same structure.
:::

```json
{}
```

## UserPasswordResetNotification

`UserPasswordResetNotification` is triggered when user requests password reset.

```json
{
  "email": string,
  "userAgent"?: string
}
```

## UserEmailVerificationNotification

`UserEmailVerificationNotification` is triggered when new user signs up.

```json
{
  "email": string,
  "userAgent"?: string
}
```
