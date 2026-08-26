import type {
  ComponentType,
  FoodActionType,
  GenericActionType,
  MealActionType,
} from '@intake24/common/prompts';
import type { FreeTextFood, MealSection, Selection, SurveyPromptSection } from '@intake24/common/surveys';
import type { PromptInstance } from '@intake24/survey/dynamic-recall/dynamic-recall';

import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoTo } from 'vuetify';

import { foodCreationState, isSelectionEqual, mealCreationState } from '@intake24/common/surveys';
import DynamicRecall from '@intake24/survey/dynamic-recall/dynamic-recall';
import { useSurvey } from '@intake24/survey/stores';
import {
  createFallbackHistoryEntry,
  destroyRecallHistory,
  handlePopState,
  initRecallHistory,
  invalidateForward,
  maybePushFallbackHistoryEntry,
  pushFullHistoryEntry,
} from '@intake24/survey/stores/recall-history';
import { getEntityId, recordPromptTransition } from '@intake24/survey/util';
import { useI18n } from '@intake24/ui/i18n';

import { FoodAdd } from '../layouts';

export function useRecall() {
  const route = useRoute();
  const router = useRouter();
  const survey = useSurvey();
  const goTo = useGoTo();

  const { i18n: { locale } } = useI18n();

  const foodAddRef = useTemplateRef<InstanceType<typeof FoodAdd>>('foodAddRef');

  const currentPrompt = ref<PromptInstance | null>(null);
  const recallController = shallowRef<DynamicRecall | null>(null);
  const hideCurrentPrompt = ref(false);
  const {
    clearPromptTransition,
    setCurrentPrompt,
    setPromptTransitionAction,
  } = createPromptTransitionController();

  const {
    hasFinished,
    hasMeals,
    meals,
    selectedFoodIndex,
    selectedMealIndex,
  } = storeToRefs(survey);

  const handlerComponent = computed(() => {
    const prompt = currentPrompt.value?.prompt;

    if (!prompt)
      throw new Error('Current prompt must be defined');

    switch (prompt.type) {
      case 'custom':
        return ['multi-prompt', 'aggregate-choice-prompt', 'food-selection-prompt', 'yes-no-prompt'].includes(prompt.component)
          ? `${prompt.component}-handler`
          : 'custom-prompt-handler';
      case 'standard':
      case 'portion-size':
        return prompt.component.endsWith('builder-prompt') ? `food-builder-prompt-handler` : `${prompt.component}-handler`;
      default:
        throw new Error(`Unexpected prompt type: ${(prompt as any).type}`);
    }
  });

  /*
  * Unique handler key to unsure handlers/prompts are reloaded between selection when using same handler/prompt
  * - not best for performance as components needs to re-render more frequently
  * * - TODO: handlers/prompts should watch for selection changes and update themselves accordingly
  * */
  const handlerKey = computed(() => {
    return [selectedFoodIndex.value?.mealIndex ?? selectedMealIndex.value, selectedFoodIndex.value?.foodIndex, currentPrompt.value?.prompt.id]
      .filter(item => item !== undefined)
      .join('-');
  });

  const surveyScheme = computed(() => survey.parameters?.surveyScheme);
  const surveyName = computed(() => survey.parameters?.name);
  const showMealList = computed(() => {
    if (!currentPrompt.value)
      return false;

    const { section, prompt } = currentPrompt.value;

    if (section === 'submission') {
      if (prompt.component === 'submit-prompt' && !prompt.review.desktop)
        return true;

      return false;
    }

    return section !== 'preMeals' || prompt.component === 'meal-add-prompt';
  });

  function onPopState(event: PopStateEvent) {
    if (hasFinished.value)
      return;

    const result = handlePopState(event);

    if (result === 'full') {
      hideCurrentPrompt.value = true;
      setPromptTransitionAction('popstate');
      setCurrentPrompt(recallController.value?.getNextPrompt() ?? null);
      hideCurrentPrompt.value = false;
    }
  };

  function setSelection(newSelection: Selection) {
    if (isSelectionEqual(survey.data.selection, newSelection))
      return;

    // Prevent the currently active prompt from crashing if it expects a different selection type
    setCurrentPrompt(null);
    survey.setSelection(newSelection);
  };

  function showMealPrompt(mealId: string, promptSection: MealSection, promptType: ComponentType) {
    setSelection({ element: { type: 'meal', mealId }, mode: 'manual' });

    const prompt = recallController.value?.promptManager.findMealPromptOfType(
      promptType,
      promptSection,
      mealId,
    );

    if (!prompt) {
      throw new Error(
        `Survey scheme is missing required meal (preFoods) prompt of type ${promptType}`,
      );
    }

    setCurrentPrompt({ section: promptSection, prompt });
  };

  function showFoodPrompt(foodId: string, promptSection: MealSection, promptType: ComponentType) {
    setSelection({ element: { type: 'food', foodId }, mode: 'manual' });

    const prompt = recallController.value?.promptManager.findFoodPromptOfType(promptType, foodId);

    if (!prompt)
      throw new Error(`Survey scheme is missing required food prompt of type ${promptType}`);

    setCurrentPrompt({ section: promptSection, prompt });
  };

  function showSurveyPrompt(promptSection: SurveyPromptSection, promptType: ComponentType) {
    setSelection({ element: null, mode: 'manual' });

    const prompt = recallController.value?.promptManager.findSurveyPromptOfType(
      promptType,
      promptSection,
    );

    if (!prompt) {
      throw new Error(
        `Survey scheme is missing required survey (preMeals) prompt of type ${promptType}`,
      );
    }

    setCurrentPrompt({ section: promptSection, prompt });
  };

  async function action(type: string, id?: string, params?: object) {
    setPromptTransitionAction(type);

    switch (type) {
      case 'next':
        await next();
        break;
      case 'restart':
        await restart();
        break;
      case 'addFood':
      case 'addMeal':
        await recallAction(type, id, params);
        break;
      case 'editMeal':
      case 'mealTime':
      case 'deleteMeal':
      case 'selectMeal':
        if (id === undefined) {
          console.warn('Recall: Meal id must be defined for meal action.', type, id);
          return;
        }

        await mealAction(type, id);
        break;
      case 'deleteFood':
      case 'changeFood':
      case 'editFood':
      case 'selectFood':
      case 'updateFood':
        if (id === undefined) {
          console.warn('Recall: Food id must be defined for food action.', type, id);
          return;
        }

        await foodAction(type, id, params);
        break;
      default:
        console.warn(`Recall: Unknown action type: ${type}`);
    }
  };

  async function mealAction(type: MealActionType, mealId: string) {
    const meal = meals.value.find(meal => meal.id === mealId);
    if (!meal) {
      console.warn(`Meal with id ${mealId} not found.`);
      return;
    }

    switch (type) {
      case 'editMeal':
        invalidateForward();
        showMealPrompt(mealId, 'preFoods', 'edit-meal-prompt');
        break;
      case 'mealTime':
        invalidateForward();
        showMealPrompt(mealId, 'preFoods', 'meal-time-prompt');
        break;
      case 'deleteMeal':
        pushFullHistoryEntry(`Delete meal: ${meal.name.en ?? Object.values(meal.name)[0] ?? 'unknown'}`);
        survey.deleteMeal(mealId);
        await nextPrompt();
        break;
      case 'selectMeal':
        invalidateForward();
        setSelection({ element: { type: 'meal', mealId }, mode: 'manual' });
        await nextPrompt();
        break;
      default:
        console.warn(`Recall: Unknown action type: ${type}`);
    }
  };

  async function foodAction(type: FoodActionType, foodId: string, params?: object) {
    switch (type) {
      case 'changeFood':
        invalidateForward();
        showFoodPrompt(foodId, 'foods', 'food-search-prompt');
        break;
      case 'editFood':
        pushFullHistoryEntry('Edit food');
        survey.editFood(foodId);
        setSelection({ element: { type: 'food', foodId }, mode: 'auto' });
        await nextPrompt();
        break;
      case 'deleteFood':
        pushFullHistoryEntry('Delete food');
        survey.deleteFood(foodId);
        await nextPrompt();
        break;
      case 'selectFood':
        invalidateForward();
        setSelection({ element: { type: 'food', foodId }, mode: 'manual' });
        await nextPrompt();
        break;
      case 'updateFood':
        // TODO: validate params properly
        if (params && typeof params === 'object' && 'code' in params)
          await survey.swapFood(foodId, params.code as string);
        await nextPrompt();
        break;
      default:
        console.warn(`Recall: Unknown action type: ${type}`);
    }
  };

  async function recallAction(action: GenericActionType | 'addFood', id?: string, params?: object) {
    if (hasFinished.value)
      return;

    switch (action) {
      case 'addFood': {
        if (!params) {
          foodAddRef.value?.open(id);
          return;
        }

        const { data, success } = foodCreationState.safeParse(params);
        if (!success) {
          console.warn('Recall: Invalid parameters for addFood action.', params);
          return;
        }

        const { name, time } = data;
        const foods: FreeTextFood[] = data.foods.map(item => ({
          type: 'free-text',
          id: getEntityId(),
          description: item,
          flags: [],
          customPromptAnswers: {},
          linkedFoods: [],
        }));

        if (id) {
          const meal = meals.value.find(meal => meal.id === id);
          if (!meal) {
            console.warn(`Meal with id ${id} not found.`);
            return;
          }

          survey.addFood({ mealId: id, food: foods });
        }
        else {
          survey.addMeal({ name, time, flags: ['free-entry-complete'], foods }, locale.value);
        }

        await nextPrompt();
        break;
      }
      case 'addMeal': {
        const { data, success } = mealCreationState.safeParse(params);
        if (!success) {
          showSurveyPrompt('preMeals', 'meal-add-prompt');
          return;
        }

        pushFullHistoryEntry('Add meal');
        const { name, time, flags } = data;
        survey.addMeal({ name, time, flags }, locale.value);
        await nextPrompt();
        break;
      }
    }
  };

  async function nextPrompt() {
    const nextPrompt = recallController.value ? recallController.value.getNextPrompt() : undefined;

    if (nextPrompt === undefined) {
      // TODO: handle completion
      if (hasMeals.value)
        await recallAction('addMeal');
      else
        setCurrentPrompt(null);
    }
    else {
      setCurrentPrompt(nextPrompt);
      createFallbackHistoryEntry(nextPrompt.prompt.component);
    }
  };

  async function next() {
    // Workaround for a crash that occurs if the currently selected prompt changes something
    // in the recall data that makes it incompatible, for example changing from 'free-text'
    // food entry type to 'encoded-food' in commitAnswer.
    //
    // In the current implementation an update/render event is triggered before the nextPrompt
    // function is executed, because most prompts have a reactive dependency on the currently
    // selected food.
    //
    // The correct implementation would be re-evaluating the current prompt type immediately
    // (via the reactivity system) in response to changes in commitAnswer.
    maybePushFallbackHistoryEntry();

    hideCurrentPrompt.value = true;

    await nextPrompt();

    hideCurrentPrompt.value = false;
  };

  async function restart() {
    setCurrentPrompt(null);
    await survey.cancelRecall();
    await router.push({
      name: 'survey-home',
      params: { surveyId: route.params.surveyId },
    });
  };

  watch(currentPrompt, () => {
    goTo(0);
  });

  onBeforeMount(async () => {
    if (!surveyScheme.value) {
      console.error('Survey scheme must be known at this point');
      return;
    }

    recallController.value = new DynamicRecall(surveyScheme.value, survey);
    initRecallHistory(survey);
    await survey.startRecall();
  });

  onMounted(async () => {
    addEventListener('popstate', onPopState);
    setPromptTransitionAction('loadRecallUI');
    await nextPrompt();
  });

  onBeforeUnmount(() => {
    removeEventListener('popstate', onPopState);
    clearPromptTransition();
    destroyRecallHistory();
  });

  function createPromptTransitionController() {
    let promptTransitionAction = 'not mapped';

    function setPromptTransitionAction(action: string) {
      promptTransitionAction = action;
    }

    function setCurrentPrompt(promptInstance: PromptInstance | null) {
      currentPrompt.value = promptInstance;

      if (!promptInstance)
        return;

      recordPromptTransition({
        action: promptTransitionAction,
        prompt_id: promptInstance.prompt.id,
        section: promptInstance.section,
        prompt_component: promptInstance.prompt.component,
      });
    }

    function clearPromptTransition() {
      promptTransitionAction = 'not mapped';
      recordPromptTransition(null);
    }

    return {
      clearPromptTransition,
      setCurrentPrompt,
      setPromptTransitionAction,
    };
  }

  return {
    currentPrompt,
    foodAddRef,
    handlerComponent,
    handlerKey,
    hideCurrentPrompt,
    meals,
    surveyName,
    showMealList,
    action,
  };
}
