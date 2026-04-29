# Languages

Intake24 bundles English texts by default. Additional languages can be added to source code and bundled during build or added to database. See [Translations](/admin/system/languages#translations) for more details.

Languages are then associated with locales and they are displayed as a list of available languages in frontend UI (`admin tool` or `survey recall`).

## Properties

- `Language ID` - valid locale ID and unique string within `language` records

- `Country flag code` - Country code to select correct flag

- `English name` - English name of the language (e.g. Czech)

- `Local name` - Local name of the language (e.g. Čeština)

- `Text direction` - Read / write direction of text. Valid options are `ltr` or `rlt`

- `Visibility` - Record visibility, valid options are `public` or `restricted` ([record visibility](/admin/acl/securables#record-visibility)).

## Translations

When new language record is created, language will be included in in both `admin` and `survey` profile language selection. However, translation needs to be provided firstly.

Language translations can be managed on two levels:

1. Source code
2. Database records

### Source code translations

Application translations are default built-in files in source code and `en` (English) files should treated as templates.

Translations are located in `packages/i18n/src`.

They are structured based on components (`admin`, `api`, `survey`) with addition of `shared` including shared translations between each components.

```
packages/i18n/src
.
├─ admin -> Admin client translations
│  └─ en -> English files
│  └─ ... -> other language files
├─ api -> API Server translations
│  └─ en -> English files
│  └─ ... -> other language files
├─ shared -> Shared translations used for all application
│  └─ en -> English files
│  └─ ... -> other language files
└─ survey -> Survey client translations
   └─ en -> English files
   └─ ... -> other language files
```

#### Adding new language translations in source code

Copy `en` folder in each section and rename to valid `locale` code.

```sh
cd packages/i18n/src/{section}

cp -r en cs
```

Modify `index.ts` to include the locale

```ts
import en from './en';
+ import cs from './cs';

- const messages: Record<string, LocaleMessages> = { en };
+ const messages: Record<string, LocaleMessages> = { en, cs };
```

### Database translations

When new language is created, `translations` tab allows to manage database translation for particular file. Click on `plus` button in `translations` section of newly created language record will initialize database set of translations. (It takes a copy of default built-in `English` set and saves it to database).

Then, `translations` tab will show a list of `application - section` records, which contains `key -> value` translations. These can now be modified / localized to desired language.

### Priority resolution

Language translations are resolved in following priority:

1. Database translations (`cs`)
2. Source code translations (`cs`)
3. Fallback database translations (`en`)
4. Fallback source code translations (`en`)

When user visits frontend application or manually changes language in user profile, it fetches available languages from server, so they get updated translations

### Translations synchronization

When source code translation files gets updates, structure can be changed when adding / editing / deleting keys. Therefore, database translations has to synchronized.

In `translations` section, there is a `synchronization` button on top of the list of translations, which triggers the synchronization for particular file.

Also there a system-level job `LanguageTranslationsSync` that can be triggered to update all language translations to up-to-date structure.

:::warning Built-in translations updates

Updating structure of database translations can potentially result in data loss in following predictable way.

Source code translation files are simple `js` object literals. See below example of when original built-in key `section` was simple string and new translation got expanded and became object of strings. Then, this new object is taken and original string removed -> this `section` string translation then gets discarded and new object with all its keys (and default English values) needs to be translated.

```js
// original translation
{
    section: 'Section',
}

// new translation
{
    section: {
        title: 'Section',
        content: 'Content',
    }
}
```

:::

## Deletion

Language deletion won't be permitted if there are locales using it. User firstly needs to update the locales to use different language.
