---
name: modify-prompt
description: Use when changing an existing Intake24 recall prompt (any `*-prompt` component), e.g. adding, renaming or removing an admin option, changing its survey UI or behaviour, when it shows, what it stores, its allowed sections or its translations. Covers keeping the shared schema, defaults, survey and admin components, i18n, docs and stored survey schemes (prompt version migrations) in sync.
---

# Modify an existing recall prompt

First read `.agents/skills/recall-prompts-reference.md` (repo root). It maps every file involved and explains the persistence rules that decide whether a migration is needed.

## 1. Find every place the prompt is used

Grep for all three name forms; prompts are also resolved by name at runtime, so a plain symbol search misses usages:

```sh
grep -rn "xxx-prompt\|xxxCamel\|XxxPascal" apps packages --include=*.ts --include=*.vue --include=*.json --include=*.md
```

(`xxx-prompt` = component, `xxxCamel` = i18n key without `-prompt`, `XxxPascal` = Vue component name.) Read the schema, default instance, survey prompt and handler, prompt-manager case(s) and admin options component before proposing changes.

## 2. Classify the change and confirm the plan with the user

| Change | Layers usually touched |
|---|---|
| Survey UI or behaviour only | Survey prompt and/or handler; maybe `prompts.<camel>` i18n strings |
| When it shows or completes | `prompt-manager.ts` case and/or `autoComplete*Prompt` |
| New admin option (additive, with default) | zod schema + default instance + admin options component + admin i18n label + survey usage + docs. No migration: the `SurveySchemesSync` job fills in the default |
| Rename, remove, retype or restructure an option, or change what an existing value means | Everything in the previous row, **plus** a prompt version migration (bump `CurrentPromptVersion`, add `apps/api/src/jobs/survey-schemes/migrations/<v>_<name>.ts`, register it under the previous version) |
| Allowed sections or tabs | `promptSettings` in `apps/admin/src/components/prompts/index.ts`. Narrowing sections doesn't move prompts already placed in schemes; tell the user |
| What it stores in recall state | `packages/common/src/surveys/recall.ts` types, survey store actions, and possibly API submission processing and data export. Confirm the scope with the user first |
| Respondent-facing text | `packages/i18n/src/shared/en/prompts.json`. Removing a key drops existing per-scheme overrides of it from the admin content tab |

State which row(s) apply and whether stored schemes will need a migration, and get agreement before editing. Ask about anything ambiguous, e.g. a default value for existing schemes, or whether old behaviour must be preserved for existing surveys.

## 3. Implement

- Keep the zod schema, default instance, `PromptStates` (if the state shape changes), survey components and admin options component consistent; the `Prompts['xxx-prompt']` type ties them together, so type-check catches most misses.
- For migrations, transform only what changed and keep the `multi-prompt` handling from the existing migrations. A migration must be safe to run on prompts saved by any older version that reaches it. Saved prompt templates (`survey_scheme_prompts`) are not migrated by the sync job; mention this to the user if the change is breaking.
- Edit only `en` translation files, then run `pnpm i18n:sync`.
- Update the prompt's section in `apps/docs/admin/surveys/prompt-types.md` if admins can see the change.

## 4. Verify and report

Run the commands in the reference's "Verification commands" section. Tell the user which manual checks matter for this change: admin editor, survey flow, and running the `SurveySchemesSync` job when the stored shape changed. List the files touched and any decisions made.
