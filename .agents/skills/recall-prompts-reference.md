# Recall prompts: architecture reference

Shared reference for the `create-prompt` and `modify-prompt` skills. Paths are relative to the repo root.

A **prompt** is one step of the dietary recall shown to a respondent in the survey app (`apps/survey`). Survey admins arrange prompts into a **survey scheme** in the admin app (`apps/admin`). Each prompt instance in a scheme is a JSON object stored in the `survey_schemes.prompts` column (and in survey-level overrides and prompt templates).

## Concepts

- **`component`**: the prompt kind, kebab-case and always ending in `-prompt` (e.g. `meal-duration-prompt`). It is the discriminator for all typing and for picking Vue components by name.
- **`type`**: the category, one of `custom`, `standard` or `portion-size`.
  - `custom`: generic questions that admins configure freely (radio list, textarea, yes/no…). Answers are stored generically in `customPromptAnswers[prompt.id]` on the survey, meal or food. One scheme can contain many instances of the same component, each with its own `id`.
  - `standard`: built-in recall steps with domain logic (food search, meal time, associated foods…). They write to dedicated fields of the survey state and have bespoke "should this show" logic.
  - `portion-size`: one prompt per portion size method (`<method-id>-prompt`), plus a few helpers (`portion-size-option-prompt`, `missing-food-prompt`, builders). They store `food.portionSize`.
- **Section**: where in the recall the prompt runs (`packages/common/src/surveys/scheme.ts`):
  - survey sections: `preMeals`, `postMeals`, `submission`
  - meal sections: `preFoods`, `foods`, `postFoods`, `foodsDeferred`
  - `foods` and `foodsDeferred` run once per food; `preFoods` and `postFoods` once per meal.
- **Base fields** every prompt has (`basePrompt` in `packages/common/src/prompts/prompts.ts`): `id`, `name`, `version`, `i18n` (per-scheme text overrides), `actions`, `conditions` (admin-defined show conditions), `useGraph`, `graph`.
- **`version`**: the shape version of the stored JSON, `CurrentPromptVersion` in `prompts.ts`. It drives the DB migrations in the API.

## Where everything lives

### 1. Shared definition: `packages/common/src/prompts/`

| File | What to touch |
|---|---|
| `prompts.ts` | The component name list (`customComponentTypes` / `standardComponentTypes` / `portionSizeComponentTypes`), the zod schema (`const xxxPrompt = z.object({ ...baseXxxPrompt.shape, component: z.literal('xxx-prompt'), ...options })`), the entry in the `singlePrompt` discriminated union, and the entry in the `prompts` map (which produces the `Prompts['xxx-prompt']` type). |
| `custom.ts` / `standard.ts` / `portion-size.ts` | The **default instance** (`export const xxxPrompt: Prompts['xxx-prompt'] = copy({ ...basePrompt (or basePortionPrompt), ...promptValidation?, component, type, id, name, ...option defaults })`) and its entry in the exported `customPrompts` / `standardPrompts` / `portionSizePrompts` array. The admin "add prompt" dialog lists these arrays, and the API sync job uses them as merge defaults. |
| `partials.ts` | Reusable option blocks (`slider`, `counter`, `timePicker`, `datePicker`, `carousel`, `hasVideo`, `layoutTypes`…) with their defaults. Spread `.shape` into the schema. |
| `prompt-states.ts` | `PromptStates['xxx-prompt']`: the in-progress UI state type for standard and portion-size prompts. Required by `createMealPromptProps` / `createFoodPromptProps` / `createPortionPromptProps` and by the handler composables. |
| `base.ts` | `basePrompt`, `basePortionPrompt`, `promptValidation` default fragments. |
| `v1/` | Legacy types, used only by old migrations. Don't touch. |

Recall state types (`FoodState`, `MealState`, `customPromptAnswers`, flags, portion size states) live in `packages/common/src/surveys/recall.ts` and `packages/common/src/surveys/portion-size.ts`.

### 2. Survey app: `apps/survey/src/`

**Prompt UI component** (presentational, emits `action` and `update:modelValue`):
- `components/prompts/custom/<kebab-name>.vue`, registered in the `customPrompts` object in `components/prompts/custom/index.ts`
- `components/prompts/standard/<PascalName>.vue`, exported from `components/prompts/standard/index.ts`
- `components/prompts/portion/<PascalName>.vue`, exported from `components/prompts/portion/index.ts`

Conventions (see `MealDurationPrompt.vue` or `textarea-prompt.vue`):
- `<script setup>`, `defineProps(createBasePromptProps<'xxx-prompt'>())` for custom prompts, or `createMealPromptProps` / `createFoodPromptProps` / `createPortionPromptProps` from `components/prompts/prompt-props.ts`.
- `const state = defineModel('modelValue', ...)`, and `const { action, translatePrompt, customPromptLayout, type } = usePromptUtils(props, { emit })` from `@intake24/survey/composables`.
- Wrap the content in a layout from `components/prompts/layouts` (`card-layout`, `panel-layout`, `base-layout`). Custom prompts use `<component :is="customPromptLayout">` so the scheme's layout setting applies. Pass `isValid` to the layout.
- Put the "continue" button in the `#actions` slot with the `Next` partial, and call `action('next')`.
- Translatable UI strings: `translatePrompt(['key1', 'key2'])` reads `prompts.<promptType>.<key>`. Admin-provided option text: `translate(prompt.someLocaleField)` from `useI18n()` in `@intake24/ui`.
- Reusable widgets live in `components/prompts/partials/`.

**Handler** (connects the prompt to the store, commits the answer):
- The handler name is derived in `components/recall/use-recall.ts` (`handlerComponent`):
  - `custom` → `custom-prompt-handler` (generic: stores the answer in `customPromptAnswers[prompt.id]`). The exceptions are listed explicitly there (`multi-prompt`, `aggregate-choice-prompt`, `food-selection-prompt`, `yes-no-prompt`) and get `<component>-handler`.
  - `standard` / `portion-size` → `<component>-handler`. `*builder-prompt` → `food-builder-prompt-handler`.
- Handlers: `components/handlers/{custom,standard,portion-size}/<PascalName>Handler.vue`, registered in that folder's `index.ts`. They are spread into the components of `recall-desktop.vue` and `recall-mobile.vue`.
- `defineProps(createHandlerProps<'xxx-prompt'>())` (`components/handlers/composables/create-handler-props.ts`).
- Pick a state composable from `components/handlers/composables/`:
  - `usePromptHandlerNoStore({ emit }, computedInitialState, commitAnswer)`: transient state. Example: `MealDurationPromptHandler.vue`.
  - `usePromptHandlerStore(props, { emit }, getInitialState, commitAnswer)`: persists partial state per food or meal across navigation. Required for portion-size prompts (`actionPortionSize`, `commitPortionSize`).
  - `useFoodPromptUtils()` / `useMealPromptUtils()` give the current food or meal.
- `commitAnswer` writes the final result via survey store actions (`useSurvey()` in `stores/survey.ts`, e.g. `setMealDuration`, `updateFood`, `addFoodFlag`).

**When a prompt shows**: `dynamic-recall/prompt-manager.ts`
- The prompt manager walks a section's prompts in scheme order and picks the first prompt for which both `check{Survey,Meal,Food}StandardConditions(...)` **and** `checkPromptCustomConditions(...)` (the admin-defined conditions) are true.
- The `default:` branch of each standard-conditions switch means "no answer in `customPromptAnswers[prompt.id]` yet". That is right for custom prompts. **Every standard and portion-size prompt needs its own `case`**, usually "the field I write is still empty", or a completion flag check. Otherwise it never shows or never stops showing. Log the decision with `recallLog().promptCheck(component, bool, reason)` like the neighbouring cases do.
- Portion-size prompts check `portionSizeMethodSelected(foodState, '<method>') && !<method>Complete(foodState)` (`packages/common/src/util/portion-size-checks.ts`).
- `autoCompleteMealPrompt` / `autoCompleteFoodPrompt`: optional auto-skip logic (e.g. `split-food-prompt`, `ready-meal-prompt`).
- `dynamic-recall/dynamic-recall.ts` and `selection-manager.ts` control meal and food selection. They rarely need changes.

### 3. Admin app: `apps/admin/src/components/prompts/`

- The scheme editor dialog is `prompt-selector.vue`. It renders shared tabs: `general` (id/name), `content` (i18n overrides, `partials/prompt-content.vue`), `actions`, `conditions`, `validation`, `json`. It then renders `<component :is="prompt.component" v-bind="prompt" @update:options=...>` for the prompt-specific **options** tab.
- Options component: `{custom,standard,portion-size}/<kebab-name>.vue`, registered in that folder's `index.ts` under its PascalCase name. Its root is `<v-tabs-window-item value="options">`. It takes one prop per option field, typed as `Prompts['xxx-prompt']['field']`, and emits `update:options` with `{ [field]: value }` via `useBasePrompt(props, { emit })` from `../partials` (preferred in `<script setup>`; older files use the `basePrompt` mixin). Prompts with no options still need a component (an empty `options` window item).
- Reusable settings editors in `partials/` (`slider-settings`, `timer-picker-settings`, `food-browser-settings`, `image-map-settings`, `food-search-hints`, `food-filter`, `carousel`…).
- `index.ts` → `promptSettings[component] = { tabs, sections }`. `tabs` is `tabs` or `tabsWithValidation` (when the schema has `validation`). `sections` lists where admins may place the prompt. The type is `Record<ComponentType, …>`, so a missing entry fails type-check.

### 4. Translations: `packages/i18n/src/`

- `shared/en/prompts.json` → `prompts.<promptType>`, where `promptType` is the camelCased component without `-prompt` (`packages/ui/src/util/prompts.ts`), e.g. `meal-duration-prompt` → `mealDuration`. It holds `name`, `text`, `description` (HTML) and any UI strings. The admin **content** tab lists every key of this object as overridable per scheme (`prompt.i18n[key]`), so keep it to respondent-facing strings.
- `admin/en/survey-schemes.json` → `survey-schemes.prompts.<component>`: `title` and `subtitle` (shown in the prompt type picker) plus labels for the admin options tab.
- Only edit `en`. Then run `pnpm i18n:sync`: it copies new English keys into the other languages and removes keys that no longer exist in `en`.

### 5. Persistence and migrations: `apps/api/src/jobs/survey-schemes/`

- `survey-schemes-sync.ts` (`SurveySchemesSync` job, run from the admin jobs UI):
  1. Runs version migrations on each stored prompt until no migration matches its `version`.
  2. Deep-merges each stored prompt over its default instance from `customPrompts` / `standardPrompts` / `portionSizePrompts`.
- It covers `survey_schemes.prompts` and `surveys.survey_scheme_overrides.prompts`. It does **not** touch saved prompt templates (`survey_scheme_prompts`).
- **Adding an optional field, or one with a default** → no migration. The sync job fills it in from the default instance, and the admin editor also merges defaults when opening a prompt.
- **Renaming, removing, restructuring or retyping a field, or changing semantics** → deep-merge won't fix stored data (stale keys stay, wrongly typed values win). You need a migration:
  1. Bump `CurrentPromptVersion` in `packages/common/src/prompts/prompts.ts`.
  2. Add `migrations/<newVersion>_<snake_name>.ts`. Copy the shape of `4_or_previous_option.ts`: handle `multi-prompt` sub-prompts and set `version`.
  3. Register it in `migrations/index.ts`, keyed by the **previous** version.
- Sequelize DB migrations (`packages/db/sequelize/system/migrations`) are not needed for prompt shape changes; prompts are JSON.

### 6. Docs

`apps/docs/admin/surveys/prompt-types.md` has a section per prompt (description, options). Update it for user-visible changes.

## Verification commands

```sh
pnpm --filter @intake24/survey type-check
pnpm --filter @intake24/admin type-check
pnpm --filter @intake24/api typecheck
pnpm --filter @intake24/common test:unit
pnpm lint
pnpm i18n:sync
```

## Worked example

`meal-duration-prompt` is a small standard prompt that touches every layer above. Trace it with `grep -rn "meal-duration-prompt\|mealDuration\|MealDuration" apps packages --include=*.ts --include=*.vue --include=*.json --include=*.md`.
