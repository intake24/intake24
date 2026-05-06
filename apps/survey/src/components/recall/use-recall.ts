import type {
  ComponentType,
  FoodActionType,
  GenericActionType,
  MealActionType,
} from '@intake24/common/prompts';
import type { FreeTextFood, MealCreationState, MealSection, Selection, SurveyPromptSection } from '@intake24/common/surveys';
import type { Time } from '@intake24/common/util';
import type { PromptInstance } from '@intake24/survey/dynamic-recall/dynamic-recall';

import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoTo } from 'vuetify';

import { isSelectionEqual } from '@intake24/common/surveys';
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
import { getEntityId } from '@intake24/survey/util';
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
        return `${prompt.component}-handler`;
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
      currentPrompt.value = recallController.value?.getNextPrompt() ?? null;
      hideCurrentPrompt.value = false;
    }
  };

  function setSelection(newSelection: Selection) {
    if (isSelectionEqual(survey.data.selection, newSelection))
      return;

    // Prevent the currently active prompt from crashing if it expects a different selection type
    currentPrompt.value = null;
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

    currentPrompt.value = { section: promptSection, prompt };
  };

  function showFoodPrompt(foodId: string, promptSection: MealSection, promptType: ComponentType) {
    setSelection({ element: { type: 'food', foodId }, mode: 'manual' });

    const prompt = recallController.value?.promptManager.findFoodPromptOfType(promptType, foodId);

    if (!prompt)
      throw new Error(`Survey scheme is missing required food prompt of type ${promptType}`);

    currentPrompt.value = { section: promptSection, prompt };
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

    currentPrompt.value = { section: promptSection, prompt };
  };

  async function action(type: string, id?: string, params?: object) {
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
        if (id === undefined) {
          console.warn('Recall: Food id must be defined for food action.', type, id);
          return;
        }

        await foodAction(type, id);
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

  async function foodAction(type: FoodActionType, foodId: string) {
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

        // TODO: validate params properly
        if (typeof params !== 'object' || params === null || !('time' in params) || !('foods' in params)) {
          console.warn('Recall: Invalid parameters for addFood action. Name is required.', params);
          return;
        }

        const payload = params as { time: Time; foods: string[] };

        const foods: FreeTextFood[] = payload.foods.map(item => ({
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
            break;
          }

          survey.addFood({ mealId: id, food: foods });
        }
        else {
          survey.addMeal({
            name: { en: 'custom', [locale.value]: 'custom' },
            time: payload.time,
            flags: ['free-entry-complete'],
            foods,
          }, locale.value);
        }

        await nextPrompt();
        break;
      }
      case 'addMeal':
        // TODO: validate params properly
        if (typeof params === 'object' && params !== null && Object.keys(params).length) {
          pushFullHistoryEntry('Add meal');
          const { name, time, flags } = params as MealCreationState;
          survey.addMeal({ name, time, flags }, locale.value);
          await nextPrompt();
        }
        else {
          showSurveyPrompt('preMeals', 'meal-add-prompt');
        }
        break;
    }
  };

  async function nextPrompt() {
    const nextPrompt = recallController.value ? recallController.value.getNextPrompt() : undefined;

    if (nextPrompt === undefined) {
      // TODO: handle completion
      if (hasMeals.value)
        await recallAction('addMeal');
      else
        currentPrompt.value = null;
    }
    else {
      currentPrompt.value = nextPrompt;
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
    currentPrompt.value = null;
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
    await nextPrompt();
  });

  onBeforeUnmount(() => {
    removeEventListener('popstate', onPopState);
    destroyRecallHistory();
  });

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
