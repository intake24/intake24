import type { Prompt, SinglePrompt } from '@intake24/common/prompts';
import type { Condition } from '@intake24/common/prompts/conditions';

function migrateCondition(condition: Condition): Condition {
  return {
    ...condition,
    orPrevious: condition.orPrevious === undefined
      ? false
      : condition.orPrevious,
  };
}

function migrateSinglePrompt(prompt: SinglePrompt): SinglePrompt {
  const conditions = prompt.conditions.map(condition => migrateCondition(condition));

  return {
    ...prompt,
    version: 4,
    conditions,
  };
}

export default function migratePrompt(prompt: Prompt): Prompt {
  if (prompt.component === 'multi-prompt') {
    const subPrompts = prompt.prompts.map(p => migrateSinglePrompt(p));
    return {
      ...prompt,
      version: 4,
      prompts: subPrompts,
      conditions: prompt.conditions.map(condition => migrateCondition(condition)),
    };
  }
  else {
    return migrateSinglePrompt(prompt);
  }
}
