---
name: create-prompt
description: Use when adding a new recall prompt type (custom, standard or portion-size) to Intake24, i.e. a new `*-prompt` component that survey admins can place in a survey scheme and respondents see in the survey app. Covers the shared zod schema and defaults, survey prompt and handler components, prompt-manager show logic, the admin options editor, i18n and docs.
---

# Create a new recall prompt

First read `.agents/skills/recall-prompts-reference.md` (repo root). It maps every file involved and explains the concepts used below.

## 1. Pin down the spec before coding

Ask the user to resolve anything that isn't stated. At minimum:

- **Component name**: kebab-case ending in `-prompt`, unique across `packages/common/src/prompts/prompts.ts`.
- **Type**: `custom`, `standard` or `portion-size`.
  - `custom` when the answer is a generic value saved under `customPromptAnswers[prompt.id]` and multiple instances per scheme make sense.
  - `standard` when it writes dedicated recall state or has built-in show and skip logic.
  - `portion-size` only for a portion size method. A *new method* also needs food DB, food admin and API changes beyond this skill, so flag that scope to the user.
- **Allowed sections** (`preMeals`, `preFoods`, `foods`, `postFoods`, `foodsDeferred`, `postMeals`, `submission`).
- **Admin-configurable options** and their defaults and constraints. Does it need `validation` (required + message)?
- **What it stores** and where (custom answer / meal field / food field / flag), and whether recall state types in `packages/common/src/surveys/recall.ts` must change. Changing recall state also affects submission processing and data export in the API; confirm that with the user.
- **When it shows** and when it counts as complete (for standard/portion-size), and whether it should auto-complete.
- **Respondent-facing strings** and **layout** (card/panel).

## 2. Implement, layer by layer

Follow the existing neighbours of the same type closely, and keep lists alphabetical where they already are.

1. **Common** (`packages/common/src/prompts/`)
   - `prompts.ts`: add to the `*ComponentTypes` list, define the zod schema, add it to `singlePrompt` and to the `prompts` map.
   - `custom.ts` / `standard.ts` / `portion-size.ts`: add the default instance and add it to the exported array.
   - `prompt-states.ts`: add `PromptStates['xxx-prompt']` for standard and portion-size prompts.
2. **Survey prompt component**: create it in `apps/survey/src/components/prompts/<type-folder>/` and register or export it in that folder's `index.ts`.
3. **Survey handler**: needed for standard and portion-size prompts, and for custom prompts only if the generic `CustomPromptHandler` is insufficient (then also add the component to the explicit list in `components/recall/use-recall.ts`). Register it in `components/handlers/<type>/index.ts`.
4. **Show logic** (standard/portion-size): add a `case` in the matching `check{Survey,Meal,Food}StandardConditions` in `apps/survey/src/dynamic-recall/prompt-manager.ts`, and optionally in `autoComplete{Meal,Food}Prompt`. Without it, the prompt falls through to the custom-answer default.
5. **Admin**
   - Create the options component in `apps/admin/src/components/prompts/<type-folder>/<kebab-name>.vue` and register it in that folder's `index.ts`.
   - Add the `promptSettings` entry in `apps/admin/src/components/prompts/index.ts`.
6. **i18n** (en only)
   - `packages/i18n/src/shared/en/prompts.json` → `prompts.<camelName>` with `name`, `text`, `description` + UI strings.
   - `packages/i18n/src/admin/en/survey-schemes.json` → `survey-schemes.prompts.<component>` with `title`, `subtitle` + option labels.
   - Run `pnpm i18n:sync`.
7. **Docs**: add a section to `apps/docs/admin/surveys/prompt-types.md` under the right heading.

A new prompt needs no version migration; `CurrentPromptVersion` stays unchanged.

## 3. Verify

Run the commands in the reference's "Verification commands" section and fix what they report. Then tell the user what to check manually: add the prompt to a scheme in the admin app (check the options and content tabs and the allowed sections), then run a recall in the survey app and confirm the prompt shows, commits and stops showing as specified. Offer to drive the apps if a run skill is available.

## 4. Report

List every file touched, grouped by layer, and call out any decisions you made that the user didn't specify.
