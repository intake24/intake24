import { isEqual } from 'lodash-es';
import { z } from 'zod';
import { foodTypes } from '../types/foods';
import { externalSources } from './external-sources';

export const conditionOpCodes = ['eq', 'ne', 'setEq', 'in', 'notIn', 'gte', 'gt', 'lte', 'lt'] as const;
export type ConditionOpCode = typeof conditionOpCodes[number];

export type ConditionValue = z.infer<typeof valueCheck.shape.value>;
export type ConditionValueOps = { value: ConditionValue; answer: ConditionValue };

function toNumber(values: ConditionValue) {
  return (Array.isArray(values) ? values : [values])
    .map(value => (typeof value === 'string' ? Number.parseFloat(value) : value))
    .filter((value): value is number => !Number.isNaN(value));
}

function toString(values: ConditionValue) {
  return (Array.isArray(values) ? values : [values])
    .map(value => value?.toString().trim().toLowerCase() || '')
    .filter(Boolean);
}

export const conditionOps = {
  eq: ({ answer, value }: ConditionValueOps) => isEqual(toString(answer), toString(value)),
  setEq: ({ answer, value }: ConditionValueOps) => isEqual(toString(answer), toString(value)),
  ne: ({ answer, value }: ConditionValueOps) => !isEqual(toString(answer), toString(value)),
  in: ({ answer, value }: ConditionValueOps) => {
    const values = toString(value);
    const answers = toString(answer);

    return answers.some(item => values.includes(item));
  },
  notIn: ({ answer, value }: ConditionValueOps) => {
    const values = toString(value);
    const answers = toString(answer);

    return answers.every(item => !values.includes(item));
  },
  gte: (ops: ConditionValueOps) => {
    const value = toNumber(ops.value).at(0);
    const answer = toNumber(ops.answer).at(0);

    if (value === undefined || answer === undefined)
      return false;

    return answer >= value;
  },
  gt: (ops: ConditionValueOps) => {
    const value = toNumber(ops.value).at(0);
    const answer = toNumber(ops.answer).at(0);

    if (value === undefined || answer === undefined)
      return false;

    return answer > value;
  },
  lte: (ops: ConditionValueOps) => {
    const value = toNumber(ops.value).at(0);
    const answer = toNumber(ops.answer).at(0);

    if (value === undefined || answer === undefined)
      return false;

    return answer <= value;
  },
  lt: (ops: ConditionValueOps) => {
    const value = toNumber(ops.value).at(0);
    const answer = toNumber(ops.answer).at(0);

    if (value === undefined || answer === undefined)
      return false;

    return answer < value;
  },
};

export const foodCompletionStateOptions = ['freeEntryComplete', 'searchComplete', 'portionSizeComplete', 'complete'] as const;
export type FoodCompletionState = typeof foodCompletionStateOptions[number];

const valueCheck = z.object({
  op: z.enum(conditionOpCodes),
  value: z.union([z.string().or(z.number()).or(z.boolean()), z.string().or(z.number()).or(z.boolean()).array()]).nullable(),
});

const valueProperty = z.object({
  type: z.literal('value'),
  check: valueCheck,
});

const booleanProperty = z.object({
  type: z.literal('boolean'),
  check: z.object({
    value: z.boolean(),
  }),
});

const drinksProperty = booleanProperty.extend({
  id: z.literal('drinks'),
});

const energyProperty = valueProperty.extend({
  id: z.literal('energy'),
});

const flagProperty = z.object({
  id: z.literal('flag'),
  type: z.literal('flag'),
  check: z.object({
    flagId: z.string(),
    value: z.boolean(),
  }),
});

const tagProperty = z.object({
  id: z.literal('tag'),
  type: z.literal('tag'),
  check: z.object({
    tagId: z.string(),
    value: z.boolean(),
  }),
});

const foodCategoryProperty = valueProperty.extend({
  id: z.literal('foodCategory'),
});

const foodTopLevelProperty = booleanProperty.extend({
  id: z.literal('foodTopLevel'),
});

const promptAnswerProperty = z.object({
  id: z.literal('promptAnswer'),
  type: z.literal('promptAnswer'),
  check: valueCheck.extend({
    promptId: z.string(),
    required: z.boolean(),
  }),
});

const recallNumberProperty = valueProperty.extend({
  id: z.literal('recallNumber'),
});

export const standardUserFields = ['name', 'submissions'] as const;

const userFieldProperty = z.object({
  id: z.literal('userField'),
  type: z.literal('userField'),
  check: valueCheck.extend({
    field: z.enum(standardUserFields).or(z.string()),
  }),
});

const mealCompletionProperty = z.object({
  id: z.literal('mealCompletion'),
  type: z.literal('mealCompletion'),
  check: z.object({
    completionState: z.enum(foodCompletionStateOptions),
  }),
});

const foodCompletionProperty = z.object({
  id: z.literal('foodCompletion'),
  type: z.literal('foodCompletion'),
  check: z.object({
    completionState: z.enum(foodCompletionStateOptions),
  }),
});

const externalSourceProperty = z.object({
  id: z.literal('externalSource'),
  type: z.literal('externalSource'),
  check: z.object({
    provider: z.enum(externalSources),
    state: z.boolean().or(z.enum(['selected', 'missing'])),
    value: z.boolean(),
  }),
});

const numberOfMealsProperty = z.object({
  id: z.literal('numberOfMeals'),
  type: z.literal('entityValue'),
  check: valueCheck.extend({
    entity: z.literal('meal'),
    flag: z.object({
      id: z.string(),
      value: z.boolean(),
    }).optional(),
  }),
});

const numberOfFoodsProperty = z.object({
  id: z.literal('numberOfFoods'),
  type: z.literal('entityValue'),
  check: valueCheck.extend({
    entity: z.literal('food'),
    type: z.enum(foodTypes).nullable(),
    flag: z.object({
      id: z.string(),
      value: z.boolean(),
    }).optional(),
    tag: z.object({
      id: z.string(),
      value: z.boolean(),
    }).optional(),
    category: z.object({
      id: z.string(),
      value: z.boolean(),
    }).optional(),
  }),
});

export const commonProperties = [
  energyProperty,
  drinksProperty,
  flagProperty,
  numberOfFoodsProperty,
  numberOfMealsProperty,
  promptAnswerProperty,
] as const;

export const surveyProperties = z.discriminatedUnion('id', [
  ...commonProperties,
  mealCompletionProperty,
  recallNumberProperty,
  userFieldProperty,
]);

export const mealProperties = z.discriminatedUnion('id', [
  ...commonProperties,
  mealCompletionProperty,
]);

export const foodProperties = z.discriminatedUnion('id', [
  ...commonProperties,
  foodTopLevelProperty,
  foodCategoryProperty,
  tagProperty,
  foodCompletionProperty,
  externalSourceProperty,
]);

const surveyCondition = z.object({ object: z.literal('survey'), orPrevious: z.boolean(), property: surveyProperties });

const mealCondition = z.object({ object: z.literal('meal'), orPrevious: z.boolean(), property: mealProperties });

const foodCondition = z.object({ object: z.literal('food'), orPrevious: z.boolean(), property: foodProperties });

export const condition = z.discriminatedUnion('object', [
  surveyCondition,
  mealCondition,
  foodCondition,
]);

export type ValueProperty = z.infer<typeof valueProperty>;
export type BooleanProperty = z.infer<typeof booleanProperty>;
export type DrinksProperty = z.infer<typeof drinksProperty>;
export type EnergyProperty = z.infer<typeof energyProperty>;
export type FlagProperty = z.infer<typeof flagProperty>;
export type NumberOfFoodsProperty = z.infer<typeof numberOfFoodsProperty>;
export type NumberOfMealsProperty = z.infer<typeof numberOfMealsProperty>;
export type TagProperty = z.infer<typeof tagProperty>;
export type PromptAnswerProperty = z.infer<typeof promptAnswerProperty>;
export type RecallNumberProperty = z.infer<typeof recallNumberProperty>;
export type UserFieldProperty = z.infer<typeof userFieldProperty>;

export type ValuePropertyCheck = z.infer<typeof valueCheck>;
export type BooleanPropertyCheck = z.infer<typeof booleanProperty.shape.check>;
export type EntityValuePropertyCheck = z.infer<typeof numberOfFoodsProperty.shape.check> | z.infer<typeof numberOfMealsProperty.shape.check>;
export type MealCompletionPropertyCheck = z.infer<typeof mealCompletionProperty.shape.check>;
export type FoodCompletionPropertyCheck = z.infer<typeof foodCompletionProperty.shape.check>;
export type ExternalSourcePropertyCheck = z.infer<typeof externalSourceProperty.shape.check>;
export type FlagPropertyCheck = z.infer<typeof flagProperty.shape.check>;
export type TagPropertyCheck = z.infer<typeof tagProperty.shape.check>;
export type PromptAnswerPropertyCheck = z.infer<typeof promptAnswerProperty.shape.check>;
export type UserFieldPropertyCheck = z.infer<typeof userFieldProperty.shape.check>;

export type Condition = z.infer<typeof condition>;
export type ConditionObjectId = Condition['object'];

export type ObjectCondition<T extends ConditionObjectId> = Extract<Condition, { object: T }>;
export type ObjectProperty<T extends ConditionObjectId> = ObjectCondition<T>['property'];
export type ObjectPropertyId<T extends ConditionObjectId> = ObjectCondition<T>['property']['id'];

export const conditionObjectIds = condition.options.map(option => option.shape.object.value);

// Not sure how to keep ObjectPropertyId<ConditionObjectId> generic here instead of expanding to
// the union of all possible property ids
export const conditionObjectPropertyIds: Map<ConditionObjectId, ObjectPropertyId<ConditionObjectId>[]> = new Map((condition.options.map((condition) => {
  const objectId = condition.shape.object.value;
  const propertyIds = condition.shape.property.options.map(property => property.shape.id.value);
  return [objectId, propertyIds];
})));

const valuePropertyDefaults: ValueProperty = {
  type: 'value',
  check: {
    op: 'eq',
    value: null,
  },
};

const booleanPropertyDefaults: BooleanProperty = {
  type: 'boolean',
  check: {
    value: true,
  },
};

type CommonPropertyDefaults = {
  drinks: DrinksProperty;
  energy: EnergyProperty;
  flag: FlagProperty;
  numberOfFoods: NumberOfFoodsProperty;
  numberOfMeals: NumberOfMealsProperty;
  promptAnswer: PromptAnswerProperty;
};

const commonPropertyDefaults: CommonPropertyDefaults = {
  drinks: {
    id: 'drinks',
    ...booleanPropertyDefaults,
  },
  energy: {
    id: 'energy',
    ...valuePropertyDefaults,
  },
  flag: {
    id: 'flag',
    type: 'flag',
    check: {
      flagId: '',
      value: true,
    },
  },
  numberOfFoods: {
    id: 'numberOfFoods',
    type: 'entityValue',
    check: {
      op: 'eq',
      value: null,
      entity: 'food',
      type: null,
    },
  },
  numberOfMeals: {
    id: 'numberOfMeals',
    type: 'entityValue',
    check: {
      op: 'eq',
      value: null,
      entity: 'meal',
    },
  },
  promptAnswer: {
    id: 'promptAnswer',
    type: 'promptAnswer',
    check: {
      promptId: '',
      op: 'eq',
      value: null,
      required: true,
    },
  },
};

export type PromptConditionDefaults = {
  survey: Record<ObjectPropertyId<'survey'>, ObjectProperty<'survey'>>;
  meal: Record<ObjectPropertyId<'meal'>, ObjectProperty<'meal'>>;
  food: Record<ObjectPropertyId<'food'>, ObjectProperty<'food'>>;
};

export const promptConditionDefaults: PromptConditionDefaults = {
  survey: {
    ...commonPropertyDefaults,
    mealCompletion: {
      id: 'mealCompletion',
      type: 'mealCompletion',
      check: {
        completionState: 'searchComplete',
      },
    },
    recallNumber: {
      id: 'recallNumber',
      ...valuePropertyDefaults,
    },
    userField: {
      id: 'userField',
      type: 'userField',
      check: {
        field: 'name',
        op: 'eq',
        value: null,
      },
    },
  },
  meal: {
    ...commonPropertyDefaults,
    mealCompletion: {
      id: 'mealCompletion',
      type: 'mealCompletion',
      check: {
        completionState: 'searchComplete',
      },
    },
  },
  food: {
    ...commonPropertyDefaults,
    externalSource: {
      id: 'externalSource',
      type: 'externalSource',
      check: {
        provider: 'open-food-facts',
        state: true,
        value: true,
      },
    },
    foodTopLevel: {
      id: 'foodTopLevel',
      ...booleanPropertyDefaults,
    },
    foodCategory: {
      id: 'foodCategory',
      ...valuePropertyDefaults,
    },
    foodCompletion: {
      id: 'foodCompletion',
      type: 'foodCompletion',
      check: {
        completionState: 'searchComplete',
      },
    },
    tag: {
      id: 'tag',
      type: 'tag',
      check: {
        tagId: '',
        value: true,
      },
    },
  },
};

export function getConditionDefaults<T extends ConditionObjectId>(object: T, id: ObjectPropertyId<T>): Condition {
  // TypeScript won't allow doing simply promptConditionDefaults[object][id]
  // so have to do this manually
  switch (object) {
    case 'survey':
      return {
        object: 'survey',
        orPrevious: false,
        property: promptConditionDefaults.survey[id],
      };
    case 'meal':
      return {
        object: 'meal',
        orPrevious: false,
        property: promptConditionDefaults.meal[id],
      };
    case 'food':
      return {
        object: 'food',
        orPrevious: false,
        property: promptConditionDefaults.food[id],
      };
    default:
      throw new Error(`Unexpected context argument: ${object}`);
  }
}

export function conditionObjectHasProperty(objectId: ConditionObjectId, propertyId: string): boolean {
  const propertyIds = conditionObjectPropertyIds.get(objectId);

  if (propertyIds === undefined)
    throw new Error(`Unexpected condition object id: ${objectId}, expected one of ${conditionObjectIds.join(', ')}`);

  return (propertyIds as string[]).includes(propertyId);
}

export function getDefaultConditionProperty<T extends ConditionObjectId>(objectId: T): ObjectPropertyId<T> {
  const propertyIds = conditionObjectPropertyIds.get(objectId);

  if (propertyIds === undefined)
    throw new Error(`Unexpected condition object id: ${objectId}, expected one of ${conditionObjectIds.join(', ')}`);

  return propertyIds[0] as ObjectPropertyId<T>; // See conditionObjectPropertyIds definition
}
