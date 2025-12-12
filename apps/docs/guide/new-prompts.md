# Adding a New Prompt

In order to add a new prompt to the system you need to add it to the following modules and packages:

- Admin (`apps\admin`) - for a new prompt to appear in the list of available prompts
- Packages (`packages\common` and `packages\i18n`) - for a new prompt to have corresponding translation and Types for `Admin` and `Survey` modules to use
- Survey (`apps\survey`) - for a new prompts to appear in the Recall flow and to have a necessary logic.

The process of adding prompt consits of the following stages:

:::warning
We are not covering the topic of prompt logic implementation and integration into the recall flow on this page. Refer to the other guidelines or contact developers through the github. We are leaving the topic of test coverage out of the scope of this page as well. Refer to the [Testing](/guide/testing) guidelines for more information.
:::

## Admin & Packages

1. **Admin:** Add a new Prompt file in the `apps\admin\src\Components\{Prompt Type}\NEW-PROMPT-NAME.ts`. Where is `{Prompt Type}` is one of the Available Prompt Types in the Intake24 (e.g.: `custom`, `portion-size`, `standard`)
2. **Admin:** Link it to the corresponding `index.ts` file in the `{Prompt Type}` folder

```
├─ apps
   └─ admin
      └─ components
         ├─ prompts
            └─{prompt-type}
               └─ {NEW-PROMPT-NAME.ts}
               └─ index.ts
```

3. **Packages:** Add a new Prompt to the `packages\common\src\prompts\{Prompt Type}.ts` and `packages\common\src\prompts\prompts.ts`. Where is `{Prompt Type}` is one of the Available Prompt Types in the Intake24 (e.g.: `custom`, `portion-size`, `standard`). In the `{Prompt Type}.ts` you need to define a new Prompt Object for export and add it in the Corresponding prompt Component Type.

```
├─ packages
   └─ common
      └─ src
         ├─ prompts
            └─{prompt-type}.ts
            └─ prompts.ts
```

4. **Packages:** Add a new Prompt to the list of prompts in the `packages\common\src\prompts\index.ts`

```
├─ packages
   └─ common
      └─ src
         ├─ prompts
            └─ index.ts
```

5. **Packages:** Add a new property to the corresponding translation `LocaleMessageObject` in the `i18n` package. For all of the available languages. E.g.: `packages\i18n\src\admin\{Language}\survey-schemes.ts`. At the time of writing the `Language` can be one of the following: `en`, `ms`, `ta`, `zh`

```
├─ packages
   └─ i18n
      └─ src
         ├─ admin
            └─{Language}.ts
               └─ survey-schemes.ts
```

6. **Admin Dashboard** Sync the Language Translation in the Admin Dashboard for the corresponding Locale. `Languages -> {Language} -> Translation` if needed. Repeat this step at any stage where you change files in `i18n` if you have DB Translation for a given `{Language}`

## Survey & Packages

1. **Packages:** Add a new Prompt State to the `packages\common\src\prompts\prompt-states.ts`.

```
├─ packages
   └─ common
      └─ src
         ├─ prompts
            └─ prompt-states.ts
```

2. **Survey:** Add a new Handler to `apps\survey\src\components\handlers\{Prompt Type}\{NEW-PROMPT-NAME}Handler.vue`. Import and Export it in the corresponding `Index.ts`.

```
├─ apps
   └─ survey
      └─ src
         ├─ components
            └─handlers
               └─{prompt-type}
                  └─ {NEW-PROMPT-NAME}Handler.vue
                  └─ index.ts
```

3. **Survey:** Add a new prompt to the Prompt views: `apps\survey\src\components\prompts\{Prompt Type}\{NEW-PROMPT-NAME}.vue`. Import and Export it in the corresponding `Index.ts`.

```
├─ apps
   └─ survey
      └─ src
         ├─ components
            └─prompts
               └─{prompt-type}
                  └─ {NEW-PROMPT-NAME}.vue
                  └─ index.ts
```

4. **Packages** Add a new property to the corresponding translation `LocaleMessageObject` in the `i18n` package. For all of the available languages. E.g.: `packages\i18n\src\shared\{Language}\prompts.ts`. At the time of writing the `Language` can be one of the following: `en`, `ms`, `ta`, `zh`

```
├─ packages
   └─ i18n
      └─ src
         ├─ shared
            └─{Language}.ts
               └─ prompts.ts
```

5. **Packages (ONLY IF NEEDED):** Add a new property to the corresponding translation `LocaleMessageObject` in the `i18n` package. For all of the available languages. E.g.: `packages\i18n\src\survey\{Language}\`. At the time of writing the `Language` can be one of the following: `en`, `ms`, `ta`, `zh`

```
├─ packages
   └─ i18n
      └─ src
         ├─ survey
            └─{Language}.ts
               └─ RELEVANT FILES (eg.: common, profile, recall, survey)
```
