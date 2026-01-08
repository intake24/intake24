import type { SetupContext } from 'vue';
import { get, set } from 'lodash-es';
import { computed, onBeforeMount } from 'vue';

import type { ActionItem, Prompt } from '@intake24/common/prompts';
import type { FoodState, MealState, PromptSection } from '@intake24/common/surveys';
import { defaultMessages, useI18n } from '@intake24/i18n';
import { useFoodUtils, useMealUtils, usePromptUtils } from '@intake24/survey/composables';
import { useSurvey } from '@intake24/survey/stores';

export type UseLayoutProps = {
  prompt: Prompt;
  section: PromptSection;
  food?: FoodState;
  meal?: MealState;
  isValid?: boolean;
};

export function useLayout(props: UseLayoutProps, ctx: Pick<SetupContext<'action'[]>, 'emit' | 'slots'>) {
  const { i18n: globalI18n, translate } = useI18n();
  const { action, isInMultiPrompt, params, type } = usePromptUtils(props, ctx);
  const { foodName } = useFoodUtils(props);
  const { mealName, mealTime, mealNameWithTime } = useMealUtils(props);
  const survey = useSurvey();

  const meals = computed(() => survey.data.meals);
  const showSummary = computed(() => {
    if (props.prompt.component === 'submit-prompt' && props.prompt.review.mobile !== false)
      return false;

    if (survey.hasFinished)
      return false;

    return !['preMeals'].includes(props.section);
  });

  const loadPromptTranslations = () => {
    const messages = globalI18n.getLocaleMessage(globalI18n.locale.value);

    const defaultPromptMessages = get(
      defaultMessages.getMessages(globalI18n.locale.value),
      `prompts.${type.value}`,
    );

    if (defaultPromptMessages === undefined) {
      console.error(`Failed to load default translation messages using key "prompts.${type.value}", locale "${globalI18n.locale.value}". Please update the translation files!`);
    }
    else {
      Object.entries(defaultPromptMessages).forEach(([key, value]) => {
        set(messages, `prompts.${type.value}.${key}`, props.prompt.i18n[key]?.[globalI18n.locale.value] ?? value);
      });
    }

    globalI18n.setLocaleMessage(globalI18n.locale.value, messages);
  };

  const isItemValid = (item: ActionItem) => item.type !== 'next' || props.isValid;

  const foodOrMealId = computed(() => props.food?.id ?? props.meal?.id);
  const desktopActions = computed(() => props.prompt.actions?.items.filter(
    action => action.layout.includes('desktop') && isItemValid(action),
  ) ?? []);
  const hasDefaultSlot = computed(() => !!ctx.slots.default);
  const hasActionsSlot = computed(() => !!ctx.slots.actions);
  const hasNavActionsSlot = computed(() => !!ctx.slots['nav-actions']);
  const mobileActions = computed(() => props.prompt.actions?.items.filter(action =>
    action.layout.includes('mobile') && isItemValid(action)) ?? [],
  );

  const i18n = computed(() => (

    /*
       * Workaround for multi-prompt i18n
       * - at the moment scheme prompt i18n is merged into the vue-i18n instance messages, so it can be used directly
       * - this approach allows use of vue-i18n component to interpolate the i18n strings
       * - however multi-prompt is displaying multiple prompts at once, so same prompt types override each other
       * - TODO: implement own vue-i18n component and merge the i18n outside of the vue-i18n instance?
       */
    {
      /* name: this.$t(`prompts.${this.type}.name`, this.params),
        text: this.$t(`prompts.${this.type}.text`, this.params),
        description: this.translatePath(`prompts.${this.type}.description`, this.params, true), */
      name: translate(props.prompt.i18n.name, {
        params: params.value,
        path: `prompts.${type.value}.name`,
      }),
      text: translate(props.prompt.i18n.text, {
        params: params.value,
        path: `prompts.${type.value}.text`,
      }),
      description: translate(props.prompt.i18n.description, {
        params: params.value,
        path: `prompts.${type.value}.description`,
        sanitize: true,
      }),
    }
  ));

  onBeforeMount(() => {
    loadPromptTranslations();
  });

  return {
    action,
    desktopActions,
    foodName,
    foodOrMealId,
    hasActionsSlot,
    hasDefaultSlot,
    hasNavActionsSlot,
    i18n,
    isInMultiPrompt,
    mealName,
    mealTime,
    mealNameWithTime,
    mobileActions,
    params,
    showSummary,
    translate,
    type,
    meals,
  };
}
