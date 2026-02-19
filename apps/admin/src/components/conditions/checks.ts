import BooleanPropertyCheck from './boolean-check.vue';
import EntityValuePropertyCheck from './entity-value-check.vue';
import ExternalSourceCheck from './external-source-check.vue';
import FlagPropertyCheck from './flag-check.vue';
import FoodCompletionPropertyCheck from './food-completion-check.vue';
import MealCompletionPropertyCheck from './meal-completion-check.vue';
import PromptAnswerPropertyCheck from './prompt-answer-check.vue';
import TagPropertyCheck from './tag-check.vue';
import UserFieldPropertyCheck from './user-field-check.vue';
import ValuePropertyCheck from './value-check.vue';

export default {
  value: ValuePropertyCheck,
  boolean: BooleanPropertyCheck,
  entityValue: EntityValuePropertyCheck,
  mealCompletion: MealCompletionPropertyCheck,
  foodCompletion: FoodCompletionPropertyCheck,
  externalSource: ExternalSourceCheck,
  flag: FlagPropertyCheck,
  tag: TagPropertyCheck,
  promptAnswer: PromptAnswerPropertyCheck,
  userField: UserFieldPropertyCheck,
};
