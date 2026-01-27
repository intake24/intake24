import type { Condition as ConditionV2 } from '@intake24/common/prompts/conditions';
import type { Prompt as PromptV2, SinglePrompt as SinglePromptV2 } from '@intake24/common/prompts/prompts';
import type { Condition as ConditionV1 } from '@intake24/common/prompts/v1/conditions';
import type { Prompt as PromptV1, SinglePrompt as SinglePromptV1 } from '@intake24/common/prompts/v1/prompts';
import type { PromptSection } from '@intake24/common/surveys';

import { omit } from 'lodash-es';

function defaultObjectForSection(section: PromptSection): any {
  switch (section) {
    case 'preMeals':
      return 'survey';
    case 'postMeals':
      return 'survey';
    case 'submission':
      return 'survey';
    case 'preFoods':
      return 'meal';
    case 'foods':
      return 'food';
    case 'foodsDeferred':
      return 'food';
    case 'postFoods':
      return 'meal';
  }
}

function migrateCondition(condition: ConditionV1, section: PromptSection): ConditionV2 {
  switch (condition.type) {
    case 'drinks':
      return {
        orPrevious: false,
        object: 'meal',
        property: {
          id: 'drinks',
          type: 'boolean',
          check: {
            value: false,
          },
        },
      };
    case 'energy':
      return {
        orPrevious: false,
        object: condition.props.section ?? defaultObjectForSection(section),
        property: {
          id: 'energy',
          type: 'value',
          check: {
            op: condition.op,
            value: condition.value,
          },
        },
      };
    case 'flag':
      return {
        orPrevious: false,
        object: condition.props.section ?? defaultObjectForSection(section),
        property: {
          id: 'flag',
          type: 'flag',
          check: {
            flagId: Array.isArray(condition.value) ? condition.value[0].toString() : condition.toString(),
            value: true,
          },
        },
      };
    case 'foodCategory':
      return {
        orPrevious: false,
        object: 'food',
        property: {
          id: 'foodCategory',
          type: 'value',
          check: {
            op: condition.op,
            value: condition.value,
          },
        },
      };
    case 'meals':
      return {
        orPrevious: false,
        object: 'survey',
        property: {
          id: 'numberOfMeals',
          type: 'entityValue',
          check: {
            op: condition.op,
            value: condition.value,
            entity: 'meal',
          },
        },
      };
    case 'promptAnswer':
      return {
        orPrevious: false,
        object: condition.props.section ?? defaultObjectForSection(section),
        property: {
          id: 'promptAnswer',
          type: 'promptAnswer',
          check: {
            promptId: condition.props.promptId,
            op: condition.op,
            value: condition.value,
            required: true,
          },
        },
      };
    case 'property':
      switch (condition.props.name) {
        case 'recallNumber':
          return {
            orPrevious: false,
            object: 'survey',
            property: {
              id: 'recallNumber',
              type: 'value',
              check: {
                op: condition.op,
                value: condition.value,
              },
            },
          };
      }
      break; // TSC correctly detects this as unreachable but ESLint whines about case fallthrough
    case 'recallNumber':
      return {
        orPrevious: false,
        object: 'survey',
        property: {
          id: 'recallNumber',
          type: 'value',
          check: {
            op: condition.op,
            value: condition.value,
          },
        },
      };
    default:
      // Just a sense check in case incoming type is not what we expect
      throw new Error(`Migrating conditions from v1 to v2: unexpected v1 condition type ${(condition as ConditionV1).type} in (${JSON.stringify(condition)})`);
  }
}

function migrateLegacyPrompt(prompt: any, section: PromptSection): SinglePromptV2 {
  return {
    component: prompt.component,
    type: prompt.type,
    id: prompt.id,
    name: prompt.name,
    i18n: {
      ...omit(prompt.props, 'conditions'),
    },
    conditions: prompt.props.conditions.map((condition: any) => migrateCondition(condition as ConditionV1, section)),
    version: 2,
    useGraph: false,
  };
}

function migrateSinglePrompt(prompt: SinglePromptV1, section: PromptSection): SinglePromptV2 {
  // Older format that still exists in some survey scheme overrides
  if ((prompt as any).props !== undefined)
    return migrateLegacyPrompt(prompt, section);

  const conditions = prompt.conditions.map(condition => migrateCondition(condition, section));

  switch (prompt.component) {
    case 'missing-food-prompt': {
      return {
        ...prompt,
        version: 2,
        useGraph: false,
        conditions,
        barcode: { type: 'none' },
      };
    }
    case 'date-picker-prompt': {
      const { futureDates, ...rest } = prompt;
      return {
        ...rest,
        version: 2,
        useGraph: false,
        conditions,
        current: null,
        min: null,
        max: null,
      };
    }
    case 'meal-duration-prompt':
    case 'slider-prompt': {
      const { slider, ...rest } = prompt;
      return {
        ...rest,
        version: 2,
        useGraph: false,
        conditions,
        slider: {
          ...slider,
          type: 'slider',
          confirm: false,
        },
      };
    }
    case 'as-served-prompt': {
      return {
        ...prompt,
        version: 2,
        useGraph: false,
        conditions,
        multiple: false,
      };
    }
    case 'drink-scale-prompt': {
      const { multiple, ...rest } = prompt;
      return {
        ...rest,
        version: 2,
        useGraph: false,
        conditions,
        multiple: typeof multiple === 'boolean'
          ? multiple
          : {
              ...multiple,
              type: 'slider',
              confirm: false,
            },
      };
    }
    case 'edit-meal-prompt':
      return {
        ...prompt,
        version: 2,
        useGraph: false,
        conditions,
        separateDrinks: true,
        inputAutoFocus: true,
        hints: [],
      };
    case 'meal-time-prompt':
    case 'time-picker-prompt':
      return {
        ...prompt,
        version: 2,
        useGraph: false,
        conditions,
        amPmToggle: false,
        ui: 'md-clock',
      };
    default:
      // Type system infers that SinglePromptV1 component type cannot be, e.g., 'food-selection-prompt',
      // but unable to infer that the component in the return type cannot be that and complains about
      // missing fields.
      //
      // Since SinglePromptV1 component types are not going to be expanded, this typecast should be safe
      // and should prevent it from complaining when more prompt types are added to SinglePromptV2.
      return {
        ...prompt,
        version: 2,
        useGraph: false,
        conditions,
      } as SinglePromptV2;
  }
}

export default function migratePrompt(prompt: PromptV1, section: PromptSection): PromptV2 {
  if (prompt.component === 'multi-prompt') {
    const subPrompts = prompt.prompts.map(p => migrateSinglePrompt(p, section));
    return {
      ...prompt,
      version: 2,
      prompts: subPrompts,
      useGraph: false,
      conditions: prompt.conditions.map(condition => migrateCondition(condition, section)),
    };
  }
  else {
    return migrateSinglePrompt(prompt, section);
  }
}
