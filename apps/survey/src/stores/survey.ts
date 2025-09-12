import { addDays } from 'date-fns';

import { defineStore } from 'pinia';
import { v4 } from 'uuid';
import type { LinkedQuantity, PortionSizeComponentType, Prompts } from '@intake24/common/prompts';

import type {
  SurveyState as CurrentSurveyState,
  CustomPromptAnswer,
  EncodedFood,
  FoodFlag,
  FoodState,
  FreeTextFood,
  MealCreationState,
  MealFlag,
  MealState,
  MealTime,
  MissingFood,
  RecallFlow,
  RecipeBuilder,
  Selection,
  SessionSettings,
  SurveyFlag,
} from '@intake24/common/surveys';
import { sortMeals, toMealTime } from '@intake24/common/surveys';
import type { SurveyEntryResponse, SurveyUserInfoResponse } from '@intake24/common/types/http';
import { isSessionAgeValid, isSessionFixedPeriodValid } from '@intake24/common/util';
import { portionSizeComplete } from '@intake24/common/util/portion-size-checks';
import { clearPromptStores, recallLog } from '@intake24/survey/stores';
import {
  associatedFoodPromptsComplete,
  findFood,
  findMeal,
  getEntityId,
  getFoodIndex,
  getFoodIndexRequired,
  getMealIndex,
  getMealIndexForSelection,
  getMealIndexRequired,
} from '@intake24/survey/util';
import { useApp, useLoading } from '@intake24/ui/stores';
import { surveyService } from '../services';

import { getOrCreatePromptStateStore, promptStores } from './prompt';
import { useSameAsBefore } from './same-as-before';
import 'lodash/debounce';

export type MealUndo = {
  type: 'meal';
  index: number;
  value: MealState;
};

export type FoodUndo = {
  type: 'food';
  index: number;
  mealIndex: number;
  value: FoodState;
};

export interface SurveyState {
  parameters: SurveyEntryResponse | null;
  user: SurveyUserInfoResponse | null;
  data: CurrentSurveyState;
  isSubmitting: boolean;
  undo: MealUndo | FoodUndo | null;
}

export interface MealFoodIndex {
  mealIndex: number;
  foodIndex: number;
  linkedFoodIndex: number | undefined;
}

export interface FoodIndex {
  foodIndex: number;
  linkedFoodIndex: number | undefined;
}

export function createMeal(data: MealCreationState, flow: RecallFlow = '2-pass'): MealState {
  const { name, defaultTime = { hours: 8, minutes: 0 }, time, duration = null, flags = [] } = data;

  if (flow === '1-pass')
    flags.push('free-entry-complete');

  return {
    id: getEntityId(),
    name,
    defaultTime,
    time: flags.includes('meal-time:confirmed') ? (time ?? defaultTime) : time,
    duration,
    flags,
    foods: [],
    customPromptAnswers: {},
  };
}

export function surveyInitialState(): CurrentSurveyState {
  return {
    schemeId: null,
    recallDate: null,
    startTime: null,
    endTime: null,
    submissionTime: null,
    uxSessionId: v4(),
    flags: [],
    customPromptAnswers: {},
    selection: {
      element: null,
      mode: 'auto',
    },
    meals: [],
  };
}

function canUseUserSession(state: CurrentSurveyState, settings?: SessionSettings) {
  const { startTime } = state;

  if (!startTime)
    return false;

  const { age = null, fixed = null } = settings ?? {};
  const startDt = new Date(startTime);

  if (!isSessionAgeValid(age, startDt) || !isSessionFixedPeriodValid(fixed, startDt))
    return false;

  return true;
}

export const useSurvey = defineStore('survey', {
  state: (): SurveyState => ({
    parameters: null,
    user: null,
    data: surveyInitialState(),
    isSubmitting: false,
    undo: null,
  }),
  debounce: {
    storeUserSession: [
      2000,
      { maxWait: 15000 },
    ],
  },
  persist: {
    pick: ['data', 'user'],
    afterHydrate(context) {
      context.store.reCreateStoreAfterDeserialization();

      context.store.validateState(context.store.$state.data);
    },
  },
  getters: {
    currentState: state => state.data,
    defaultSchemeMeals: state => state.parameters?.surveyScheme.meals,
    feedbackEnabled: state => !!state.parameters?.feedbackScheme,
    feedbackAvailable: state => !!state.user?.showFeedback,
    foodPrompts: state => state.parameters?.surveyScheme.prompts.meals.foods ?? [],
    hasMeals: state => !!state.data.meals.length,
    hasFinished: state => !!state.data.endTime,
    hasStarted: state => !!state.data.startTime,
    isSubmitted: state => !!state.data.submissionTime,
    localeId: state => state.parameters?.locale.code ?? 'en_GB',
    slug: state => state.parameters?.slug,
    meals: state => state.data.meals,
    parametersLoaded: state => !!state.parameters && !!state.user,
    searchParameters: (state) => {
      const { searchSortingAlgorithm: rankingAlgorithm, searchMatchScoreWeight: matchScoreWeight }
        = state.parameters ?? {};

      return { matchScoreWeight, rankingAlgorithm };
    },
    surveyEnabled: state => state.parameters?.state === 'active',
    dailyLimitReached: state => !!state.user?.maximumDailySubmissionsReached,
    totalLimitReached: state => !!state.user?.maximumTotalSubmissionsReached,
    limitReached(): boolean {
      return !!(
        this.user?.maximumDailySubmissionsReached || this.user?.maximumTotalSubmissionsReached
      );
    },
    recallAllowed(): boolean {
      return this.surveyEnabled && !this.limitReached;
    },
    recallNumber(): number {
      return (this.user?.submissions ?? 1) + (this.isSubmitted ? 0 : 1);
    },
    feedbackAllowed(): boolean {
      return this.feedbackEnabled && this.feedbackAvailable;
    },
    registeredPortionSizeMethods(): string[] {
      return (
        this.foodPrompts
          .filter(item => item.type === 'portion-size')
          .map(item => item.component.replace('-prompt', '')) ?? []
      );
    },
    linkedQuantity(): LinkedQuantity | undefined {
      const prompt = this.foodPrompts.find(
        (prompt): prompt is Prompts['guide-image-prompt'] => prompt.component === 'guide-image-prompt',
      );

      return prompt?.linkedQuantity;
    },
    recallDate: (state) => {
      if (state.data.recallDate)
        return new Date(state.data.recallDate);

      const offset = state.parameters?.surveyScheme.settings.recallDate;
      if (typeof offset === 'number')
        return addDays(new Date(), offset);

      return undefined;
    },
    sameAsBeforeAllowed(): boolean {
      return !!this.foodPrompts.find(
        item => item.component === 'same-as-before-prompt',
      );
    },
    selection: state => state.data.selection,
    selectedMealIndex(): number | undefined {
      const { element } = this.data.selection;

      if (element === null)
        return undefined;
      if (element.type !== 'meal')
        return getMealIndexForSelection(this.data.meals, this.data.selection);

      return getMealIndex(this.data.meals, element.mealId);
    },
    selectedMealOptional(): MealState | undefined {
      const mealIndex = this.selectedMealIndex;
      if (mealIndex === undefined)
        return undefined;

      return this.data.meals[mealIndex];
    },
    selectedFoodIndex(): MealFoodIndex | undefined {
      const { element } = this.data.selection;

      if (element === null || element.type !== 'food')
        return undefined;

      return getFoodIndex(this.data.meals, element.foodId);
    },
    selectedFoodOptional(): FoodState | undefined {
      const foodIndex = this.selectedFoodIndex;
      if (foodIndex === undefined)
        return undefined;

      if (foodIndex.linkedFoodIndex === undefined) {
        return this.data.meals[foodIndex.mealIndex].foods[foodIndex.foodIndex];
      }
      else {
        return this.data.meals[foodIndex.mealIndex].foods[foodIndex.foodIndex].linkedFoods[
          foodIndex.linkedFoodIndex
        ];
      }
    },
    selectedParentFood(): FoodState | undefined {
      const foodIndex = this.selectedFoodIndex;
      if (foodIndex?.linkedFoodIndex === undefined)
        return undefined;

      return this.data.meals[foodIndex.mealIndex].foods[foodIndex.foodIndex];
    },
  },
  actions: {
    async loadParameters(surveyId: string) {
      const loading = useLoading();
      loading.addItem('loadParameters');

      try {
        const [surveyInfo, userInfo] = await Promise.all([
          surveyService.surveyInfo(surveyId),
          surveyService.userInfo(surveyId),
        ]);

        await this.setParameters(surveyInfo);
        this.setUserInfo(userInfo);

        const userSession = !this.isSubmitted && surveyInfo.session.store ? await surveyService.getUserSession(surveyId) : undefined;
        this.loadUserSession(userSession?.sessionData);
      }
      finally {
        loading.removeItem('loadParameters');
      }
    },

    async startRecall(force = false) {
      if (!this.parameters) {
        console.warn('Survey parameters are not loaded');
        return;
      }

      if (this.hasStarted && !force) {
        console.warn('Survey already started, not restarting.');
        return;
      }

      this.clearState();
      this.setState({
        ...surveyInitialState(),
        schemeId: this.parameters.surveyScheme.id,
        startTime: new Date(),
        meals: this.parameters.surveyScheme.meals.map(({ name, time, flags }) =>
          createMeal({ name, defaultTime: toMealTime(time), flags }, this.parameters?.surveyScheme.settings.flow)),
      });

      await this.startUserSession();
    },

    async cancelRecall() {
      const { uxSessionId } = this.data;

      this.clearState();
      await this.clearUserSession(uxSessionId);
    },

    setState(payload: CurrentSurveyState) {
      this.data = payload;
      this.undo = null;
    },

    clearEntityPromptStores(entityId: string | string[]) {
      promptStores.forEach((store) => {
        store().clearState(entityId);
      });
    },

    clearState() {
      clearPromptStores();
      this.setState(surveyInitialState());
    },

    async clearUndo() {
      this.undo = null;
    },

    async setParameters(parameters: SurveyEntryResponse) {
      this.parameters = parameters;

      useApp().restrictLanguages(parameters.surveyScheme.settings.languages);
    },

    setUserInfo(user: SurveyUserInfoResponse) {
      this.user = this.user?.userId === user.userId ? { ...this.user, ...user } : user;
    },

    reCreateStoreAfterDeserialization() {
      ['startTime', 'endTime', 'submissionTime'].forEach((item) => {
        const key = item as keyof Pick<
          CurrentSurveyState,
          'startTime' | 'endTime' | 'submissionTime'
        >;

        const currentValue = this.data[key];
        if (typeof currentValue === 'string')
          this.data[key] = new Date(currentValue);
      });

      // Pinia plugin rehydrates the store without reactive getters/setters on undefined -> investigate
      this.data = {
        ...this.data,
        meals: this.data.meals.map(meal => ({ ...meal, time: meal.time ?? undefined })),
      };
    },

    loadState(state: CurrentSurveyState) {
      this.setState(state);
      this.reCreateStoreAfterDeserialization();
    },

    validateState(state: CurrentSurveyState, settings?: SessionSettings) {
      if (canUseUserSession(state, settings))
        return;

      this.clearState();
    },

    loadUserSession(serverState?: CurrentSurveyState) {
      if (!this.parameters) {
        console.error(`Survey parameters not loaded. Cannot load user session.`);
        return;
      }

      const { session } = this.parameters;
      if (serverState && session.store && canUseUserSession(serverState, session)) {
        this.loadState(serverState);
        return;
      }

      this.validateState(this.data, session);
    },

    async startUserSession() {
      if (!this.parameters) {
        console.error(`Survey parameters not loaded. Cannot start user session.`);
        return;
      }

      await surveyService.startUserSession(this.parameters.slug, this.data);
    },

    async storeUserSession() {
      if (!this.parameters) {
        console.error(`Survey parameters not loaded. Cannot store user session.`);
        return;
      }

      if (this.isSubmitting || this.isSubmitted || !this.parameters.session.store || !canUseUserSession(this.data, this.parameters.session))
        return;

      await surveyService.saveUserSession(this.parameters.slug, this.data);
    },

    async clearUserSession(sessionId?: string) {
      if (!this.parameters) {
        console.error(`Survey parameters not loaded. Cannot clear user session.`);
        return;
      }

      await surveyService.clearUserSession(this.parameters.slug, sessionId);
    },

    async submitRecall() {
      if (this.isSubmitting || this.isSubmitted) {
        console.warn('Survey is already being submitted, not submitting again.');
        return;
      }

      if (!this.parameters) {
        console.error(`Survey parameters not loaded. Cannot submit the survey.`);
        return;
      }

      this.isSubmitting = true;
      this.data.endTime = new Date();

      const { recallDate } = this.parameters.surveyScheme.settings;
      if (typeof recallDate === 'number')
        this.setRecallDate(addDays(new Date(), recallDate).toISOString().substring(0, 10));

      try {
        const { submission, ...rest } = await surveyService.submit(this.parameters.slug, this.data);
        this.setUserInfo(rest);
        this.data.id = submission.id;
        this.data.submissionTime = submission.submissionTime;
        clearPromptStores();
      }
      finally {
        this.isSubmitting = false;
      }
    },

    setSelection(selection: Selection) {
      this.data.selection = selection;
      recallLog().selectionChanged(selection);
    },

    setAutoSelection() {
      this.setSelection({ mode: 'auto', element: null });
    },

    setRecallDate(date: string | null) {
      this.data.recallDate = date;
    },

    setCustomPromptAnswer(data: { promptId: string; answer: CustomPromptAnswer }) {
      this.data.customPromptAnswers = {
        ...this.data.customPromptAnswers,
        [data.promptId]: data.answer,
      };
    },

    hasFlag(flag: SurveyFlag) {
      return this.data.flags.includes(flag);
    },

    addFlag(flag: SurveyFlag | SurveyFlag[]) {
      let flags = Array.isArray(flag) ? flag : [flag];

      flags = flags.filter(flag => !this.data.flags.includes(flag));
      if (!flags.length)
        return;

      this.data.flags.push(...flags);
    },

    removeFlag(flag: SurveyFlag | SurveyFlag[]) {
      const flags = Array.isArray(flag) ? flag : [flag];
      if (!flags.length)
        return;

      this.data.flags = this.data.flags.filter(flag => !flags.includes(flag as SurveyFlag));
    },

    sortMeals() {
      this.data.meals.sort(sortMeals);
    },

    setMealDuration(mealId: string, duration: number) {
      const mealIndex = getMealIndexRequired(this.data.meals, mealId);

      this.data.meals[mealIndex].duration = duration;
    },

    setMealTime(mealId: string, time: MealTime) {
      const mealIndex = getMealIndexRequired(this.data.meals, mealId);

      this.data.meals[mealIndex].time = time;
      this.sortMeals();
    },

    deleteMeal(mealId: string) {
      /*
      Undo system needs review & a more general solution

       const mealUndo: MealState[] = this.data.meals.splice(mealIndex, 1);
       if (mealUndo.length !== 0) {
        this.undo = { type: 'meal', index: mealIndex, value: mealUndo[0] };
      } */

      function getAlternativeMealSelection(meals: MealState[], mealIndex: number): Selection {
        // Try selecting next meal first

        if (mealIndex < meals.length - 1) {
          return {
            mode: 'auto',
            element: {
              type: 'meal',
              mealId: meals[mealIndex + 1].id,
            },
          };
        }

        // Try selecting previous meal otherwise

        if (mealIndex > 0) {
          return {
            mode: 'auto',
            element: {
              type: 'meal',
              mealId: meals[mealIndex - 1].id,
            },
          };
        }

        // If neither exists (i.e. only one food in the list) select nothing

        return { mode: 'auto', element: null };
      }

      const selectionMealIndex = getMealIndexForSelection(this.data.meals, this.data.selection);

      const mealIndex = getMealIndexRequired(this.data.meals, mealId);

      if (selectionMealIndex === mealIndex)
        this.data.selection = getAlternativeMealSelection(this.data.meals, mealIndex);

      const collectEntityIdCallback = (acc: string[], { id, linkedFoods }: FoodState) => {
        acc.push(id);

        if (linkedFoods.length)
          linkedFoods.reduce(collectEntityIdCallback, acc);

        return acc;
      };
      const entityIds = this.data.meals[mealIndex].foods.reduce(collectEntityIdCallback, [mealId]);

      this.data.meals.splice(mealIndex, 1);
      this.sortMeals();
      this.clearEntityPromptStores(entityIds);
    },

    undoDeleteMeal(data: { mealIndex: number; meal: MealState }) {
      this.data.meals.splice(data.mealIndex, 0, data.meal);
    },

    addMeal(data: MealCreationState, locale: string) {
      const { time, ...mealRest } = data;

      const id = getEntityId();
      const { time: defaultMealTime, ...defaultMealRest } = this.defaultSchemeMeals?.find(item => item.name[locale] === data.name[locale]) ?? {};
      const defaultTime = time ?? toMealTime(defaultMealTime ?? '8:00');

      const meal = createMeal({ ...defaultMealRest, ...mealRest, defaultTime, time }, this.parameters?.surveyScheme.settings.flow);
      this.data.meals.push(meal);

      this.sortMeals();
      this.setSelection({ element: { type: 'meal', mealId: meal.id }, mode: 'manual' });

      return id;
    },

    hasMealFlag(mealId: string, flag: MealFlag) {
      const meal = findMeal(this.data.meals, mealId);

      return meal.flags.includes(flag);
    },

    addMealFlag(mealId: string, flag: MealFlag | MealFlag[]) {
      const meal = findMeal(this.data.meals, mealId);
      let flags = Array.isArray(flag) ? flag : [flag];

      flags = flags.filter(flag => !meal.flags.includes(flag));
      if (!flags.length)
        return;

      meal.flags.push(...flags);
    },

    removeMealFlag(mealId: string, flag: MealFlag | MealFlag[]) {
      const flags = Array.isArray(flag) ? flag : [flag];
      if (!flags.length)
        return;

      const meal = findMeal(this.data.meals, mealId);

      meal.flags = meal.flags.filter(flag => !flags.includes(flag as MealFlag));
    },

    setMealCustomPromptAnswer(data: {
      mealId: string;
      promptId: string;
      answer: CustomPromptAnswer;
    }) {
      const meal = findMeal(this.data.meals, data.mealId);

      meal.customPromptAnswers = { ...meal.customPromptAnswers, [data.promptId]: data.answer };
    },

    setFoodCustomPromptAnswer(data: {
      foodId: string;
      promptId: string;
      answer: CustomPromptAnswer;
    }) {
      const food = findFood(this.data.meals, data.foodId);

      food.customPromptAnswers[data.promptId] = data.answer;
    },

    hasFoodFlag(foodId: string, flag: FoodFlag) {
      const food = findFood(this.data.meals, foodId);

      return food.flags.includes(flag);
    },

    addFoodFlag(foodId: string, flag: FoodFlag | FoodFlag[]) {
      const food = findFood(this.data.meals, foodId);
      let flags = Array.isArray(flag) ? flag : [flag];

      flags = flags.filter(flag => !food.flags.includes(flag));
      if (!flags.length)
        return;

      food.flags.push(...flags);

      if (
        flags.includes('portion-size-method-complete')
        || flags.includes('associated-foods-complete')
      ) {
        this.saveSameAsBefore(foodId);
      }
    },

    removeFoodFlag(foodId: string, flag: FoodFlag | FoodFlag[]) {
      const flags = Array.isArray(flag) ? flag : [flag];
      if (!flags.length)
        return;

      const food = findFood(this.data.meals, foodId);

      food.flags = food.flags.filter(flag => !flags.includes(flag as FoodFlag));
    },

    setFoodFlag(foodId: string, flag: FoodFlag | FoodFlag[], state: boolean) {
      if (state) {
        this.addFoodFlag(foodId, flag);
        return;
      }

      this.removeFoodFlag(foodId, flag);
    },

    replaceFood({ foodId, food }: { foodId: string; food: FoodState }) {
      const { foodIndex, mealIndex, linkedFoodIndex } = getFoodIndexRequired(
        this.data.meals,
        foodId,
      );

      const originalFood
        = linkedFoodIndex === undefined
          ? this.data.meals[mealIndex].foods[foodIndex]
          : this.data.meals[mealIndex].foods[foodIndex].linkedFoods[linkedFoodIndex];

      if (linkedFoodIndex === undefined)
        this.data.meals[mealIndex].foods.splice(foodIndex, 1, food);
      else
        this.data.meals[mealIndex].foods[foodIndex].linkedFoods.splice(linkedFoodIndex, 1, food);

      // Clear food prompt stores if replacing food with different type or different code
      if (
        originalFood.type !== food.type
        || (originalFood.type === 'encoded-food'
          && food.type === 'encoded-food'
          && originalFood.data.code !== food.data.code)
      ) {
        this.clearEntityPromptStores(foodId);
      }
    },

    /*
     * Save to `same-as-before` for encoded foods with finished portion size estimation
     * - triggered when 'portion-size-method-complete' flag added
     */
    saveSameAsBefore(foodId: string) {
      // TODO: check associated foods ?
      if (!this.sameAsBeforeAllowed)
        return;

      const { foodIndex, mealIndex } = getFoodIndexRequired(this.data.meals, foodId);
      const mainFood = this.data.meals[mealIndex].foods[foodIndex];

      if (
        // 1) food is not encoded
        mainFood.type !== 'encoded-food'
        // 2) food portion size estimation is not finished
        || !portionSizeComplete(mainFood)
        // 3) associated food prompts are not finished
        || !associatedFoodPromptsComplete(mainFood)
        // 4) associated foods portion size estimations are not finished
        || (mainFood.linkedFoods.length
          && mainFood.linkedFoods.some(item => !portionSizeComplete(item)))
      ) {
        return;
      }

      useSameAsBefore().saveItem(this.localeId, mainFood);
    },

    editFood(foodId: string) {
      const food = findFood(this.data.meals, foodId);
      if (food.type === 'free-text')
        return;

      const flags: FoodFlag[] = [];

      if (food.type === 'encoded-food') {
        if (!food.flags.includes('portion-size-option-complete'))
          return;

        flags.push('portion-size-method-complete');

        if (food.portionSize) {
          const component: PortionSizeComponentType = `${food.portionSize.method}-prompt`;
          const store = getOrCreatePromptStateStore(component)();
          const prompt = this.foodPrompts.find(item => item.component === component);

          if (store && prompt)
            store.clearState(food.id, prompt.id);
        }
      }

      if (food.type === 'missing-food') {
        if (!food.flags.includes('missing-food-complete'))
          return;

        flags.push('missing-food-complete');
      }

      if (!flags.length)
        return;

      this.removeFoodFlag(foodId, flags);
    },

    updateFood(data: {
      foodId: string;
      update:
        | Partial<Omit<FreeTextFood, 'type'>>
        | Partial<Omit<EncodedFood, 'type'>>
        | Partial<Omit<MissingFood, 'type'>>
        | Partial<Omit<RecipeBuilder, 'type'>>;
    }) {
      const foodState = findFood(this.meals, data.foodId);
      this.replaceFood({ foodId: data.foodId, food: { ...foodState, ...data.update } });
    },

    addLinkedFoods(foodId: string, linkedFoods: FoodState[]) {
      const foodState = findFood(this.meals, foodId);
      foodState.linkedFoods.push(...linkedFoods);
    },

    deleteFood(foodId: string) {
      /*
      Undo system needs review & a more general solution

      const foodUndo: FoodState[] = this.data.meals[data.mealIndex].foods.splice(data.foodIndex, 1);
      if (foodUndo.length !== 0) {
        this.undo = {
          type: 'food',
          index: data.foodIndex,
          mealIndex: data.mealIndex,
          value: foodUndo[0],
        };
      } */

      const foodIndex = getFoodIndexRequired(this.data.meals, foodId);

      if (foodIndex.linkedFoodIndex === undefined) {
        this.data.meals[foodIndex.mealIndex].foods.splice(foodIndex.foodIndex, 1);
      }
      else {
        this.data.meals[foodIndex.mealIndex].foods[foodIndex.foodIndex].linkedFoods.splice(
          foodIndex.linkedFoodIndex,
          1,
        );

        const parentFood = this.data.meals[foodIndex.mealIndex].foods[foodIndex.foodIndex];
        if (parentFood.type === 'recipe-builder' && !parentFood.linkedFoods.length)
          this.data.meals[foodIndex.mealIndex].foods.splice(foodIndex.foodIndex, 1);
      }

      // FIXME: update selection
      this.data.selection = { mode: 'auto', element: null };

      this.clearEntityPromptStores(foodId);
    },

    addFood({ mealId, food, at }: { mealId: string; food: FoodState; at?: number }) {
      const mealIndex = getMealIndexRequired(this.data.meals, mealId);

      if (at !== undefined)
        this.data.meals[mealIndex].foods.splice(at, 0, food);
      else this.data.meals[mealIndex].foods.push(food);
    },

    setFoods(data: { mealId: string; foods: FoodState[] }) {
      const mealIndex = getMealIndexRequired(this.data.meals, data.mealId);
      this.data.meals[mealIndex].foods = data.foods;
    },
  },
});

export type SurveyStoreDef = typeof useSurvey;

export type SurveyStore = ReturnType<SurveyStoreDef>;
