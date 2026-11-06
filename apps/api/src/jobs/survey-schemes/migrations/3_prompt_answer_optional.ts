import type { Prompt, SinglePrompt } from '@intake24/common/prompts';
import type { Condition } from '@intake24/common/prompts/conditions';

function migrateCondition(condition: Condition): Condition {
  switch (condition.property.type) {
    case 'promptAnswer':
      return {
        orPrevious: false,
        object: condition.object,
        property: {
          id: condition.property.id,
          type: condition.property.type,
          check: {
            promptId: condition.property.check.promptId,
            op: condition.property.check.op,
            value: condition.property.check.value,
            required: condition.property.check.required === undefined
              ? true
              : condition.property.check.required,
          },
        },
      };
    default:
      return condition;
  }
}

function migrateSinglePrompt(prompt: SinglePrompt): SinglePrompt {
  const conditions = prompt.conditions.map(condition => migrateCondition(condition));

  return {
    ...prompt,
    version: 3,
    conditions,
  };
}

export default function migratePrompt(prompt: Prompt): Prompt {
  if (prompt.component === 'multi-prompt') {
    const subPrompts = prompt.prompts.map(p => migrateSinglePrompt(p));
    return {
      ...prompt,
      version: 3,
      prompts: subPrompts,
      conditions: prompt.conditions.map(condition => migrateCondition(condition)),
    };
  }
  else {
    return migrateSinglePrompt(prompt);
  }
}
