import { mapState } from 'pinia';
import { defineComponent } from 'vue';
import { useGoTo } from 'vuetify';

import type {
  ComponentType,
  FoodActionType,
  GenericActionType,
  MealActionType,
} from '@intake24/common/prompts';
import type { MealCreationState, MealSection, MealState, Selection, SurveyPromptSection } from '@intake24/common/surveys';
import { isSelectionEqual } from '@intake24/common/surveys';
import type { SchemeEntryResponse } from '@intake24/common/types/http';
import {
  customHandlers,
  portionSizeHandlers,
  standardHandlers,
} from '@intake24/survey/components/handlers';
import type { PromptInstance } from '@intake24/survey/dynamic-recall/dynamic-recall';
import DynamicRecall from '@intake24/survey/dynamic-recall/dynamic-recall';
import { useSurvey } from '@intake24/survey/stores';
import { getFoodIndex, getMealIndex } from '@intake24/survey/util';
import { InfoAlert } from '../elements';

export default defineComponent({
  name: 'RecallMixin',

  components: {
    InfoAlert,
    ...customHandlers,
    ...standardHandlers,
    ...portionSizeHandlers,
  },

  data() {
    const goTo = useGoTo();
    const survey = useSurvey();

    return {
      goTo,
      survey,
      currentPrompt: null as PromptInstance | null,
      recallController: null as DynamicRecall | null,
      hideCurrentPrompt: false,
      // This is only required to discern between back and forward history events
      currentPromptTimestamp: 0,
    };
  },

  computed: {
    ...mapState(useSurvey, [
      'selectedMealOptional',
      'hasFinished',
      'hasMeals',
      'meals',
      'selection',
      'selectedFoodIndex',
      'selectedMealIndex',
    ]),

    handlerComponent(): string {
      const prompt = this.currentPrompt?.prompt;

      if (!prompt)
        throw new Error('Current prompt must be defined');

      switch (prompt.type) {
        case 'custom':
          return ['multi-prompt', 'aggregate-choice-prompt', 'general-associated-foods-prompt', 'food-selection-prompt', 'yes-no-prompt'].includes(prompt.component)
            ? `${prompt.component}-handler`
            : 'custom-prompt-handler';
        case 'standard':
        case 'portion-size':
          return `${prompt.component}-handler`;
        default:
          throw new Error(`Unexpected prompt type: ${(prompt as any).type}`);
      }
    },

    /*
     * Unique handler key to unsure handlers/prompts are reloaded between selection when using same handler/prompt
     * - not best for performance as components needs to re-render more frequently
     * - TODO: handlers/prompts should watch for selection changes and update themselves accordingly
     */
    handlerKey(): string {
      const {
        currentPrompt,
        selectedFoodIndex: { foodIndex, mealIndex } = {},
        selectedMealIndex,
      } = this;

      return [mealIndex ?? selectedMealIndex, foodIndex, currentPrompt?.prompt.id]
        .filter(item => item !== undefined)
        .join('-');
    },

    surveyScheme(): SchemeEntryResponse | undefined {
      return this.survey.parameters?.surveyScheme;
    },

    surveyName(): string | undefined {
      return this.survey.parameters?.name;
    },

    showMealList(): boolean {
      if (!this.currentPrompt)
        return false;

      const { section, prompt } = this.currentPrompt;

      if (section === 'submission') {
        if (prompt.component === 'submit-prompt' && !prompt.review.desktop)
          return true;

        return false;
      }

      return section !== 'preMeals' || prompt.component === 'meal-add-prompt';
    },
  },

  watch: {
    currentPrompt() {
      this.goTo(0);
    },
  },

  async created() {
    if (!this.surveyScheme) {
      console.error('Survey scheme must be known at this point');
      return;
    }

    this.recallController = new DynamicRecall(this.surveyScheme, this.survey);
    await this.survey.startRecall();
  },

  async mounted() {
    addEventListener('popstate', this.onPopState);
    await this.nextPrompt();
  },

  beforeUnmount() {
    removeEventListener('popstate', this.onPopState);
  },

  methods: {
    onPopState(event: PopStateEvent) {
      if (this.hasFinished)
        return;

      function isValidSelection(meals: MealState[], selection: Selection): boolean {
        if (
          selection.element
          && selection.element.type === 'meal'
          && getMealIndex(meals, selection.element.mealId) === undefined
        ) {
          return false;
        }

        if (
          selection.element
          && selection.element.type === 'food'
          && getFoodIndex(meals, selection.element.foodId) === undefined
        ) {
          return false;
        }

        return true;
      }

      if (
        event.state
        && event.state.promptInstance
        && event.state.selection
        && event.state.timeStamp
      ) {
        const promptInstance = event.state.promptInstance as PromptInstance;
        const selection = event.state.selection as Selection;
        const timeStamp = event.state.timeStamp as number;

        if (isValidSelection(this.meals, selection)) {
          this.setSelection(selection);
          this.currentPrompt = promptInstance;
          this.currentPromptTimestamp = timeStamp;
        }
        else if (this.currentPromptTimestamp > timeStamp) {
          history.back();
        }
        else {
          history.forward();
        }
      }
    },

    setSelection(newSelection: Selection) {
      if (isSelectionEqual(this.survey.data.selection, newSelection))
        return;

      // Prevent the currently active prompt from crashing if it expects a different selection type
      this.currentPrompt = null;
      this.survey.setSelection(newSelection);
    },

    showMealPrompt(mealId: string, promptSection: MealSection, promptType: ComponentType) {
      this.setSelection({ element: { type: 'meal', mealId }, mode: 'manual' });

      const prompt = this.recallController?.promptManager.findMealPromptOfType(
        promptType,
        promptSection,
        mealId,
      );

      if (!prompt) {
        throw new Error(
          `Survey scheme is missing required meal (preFoods) prompt of type ${promptType}`,
        );
      }

      this.currentPrompt = { section: promptSection, prompt };
    },

    showFoodPrompt(foodId: string, promptSection: MealSection, promptType: ComponentType) {
      this.setSelection({ element: { type: 'food', foodId }, mode: 'manual' });

      const prompt = this.recallController?.promptManager.findFoodPromptOfType(promptType, foodId);

      if (!prompt)
        throw new Error(`Survey scheme is missing required food prompt of type ${promptType}`);

      this.currentPrompt = { section: promptSection, prompt };
    },

    showSurveyPrompt(promptSection: SurveyPromptSection, promptType: ComponentType) {
      this.setSelection({ element: null, mode: 'manual' });

      const prompt = this.recallController?.promptManager.findSurveyPromptOfType(
        promptType,
        promptSection,
      );

      if (!prompt) {
        throw new Error(
          `Survey scheme is missing required survey (preMeals) prompt of type ${promptType}`,
        );
      }

      this.currentPrompt = { section: promptSection, prompt };
    },

    async action(type: string, id?: string, params?: object) {
      switch (type) {
        case 'next':
        case 'restart':
          await this[type]();
          break;
        case 'addMeal':
          await this.recallAction(type, params);
          break;
        case 'editMeal':
        case 'mealTime':
        case 'deleteMeal':
        case 'selectMeal':
          if (id === undefined) {
            console.warn('Recall: Meal id must be defined for meal action.', type, id);
            return;
          }

          await this.mealAction(type, id);
          break;
        case 'deleteFood':
        case 'changeFood':
        case 'editFood':
        case 'selectFood':
          if (id === undefined) {
            console.warn('Recall: Food id must be defined for food action.', type, id);
            return;
          }

          await this.foodAction(type, id);
          break;
        default:
          console.warn(`Recall: Unknown action type: ${type}`);
      }
    },

    async mealAction(type: MealActionType, mealId: string) {
      const meal = this.meals.find(meal => meal.id === mealId);
      if (!meal) {
        console.warn(`Meal with id ${mealId} not found.`);
        return;
      }
      switch (type) {
        case 'editMeal':
          this.showMealPrompt(mealId, 'preFoods', 'edit-meal-prompt');
          break;
        case 'mealTime':
          this.showMealPrompt(mealId, 'preFoods', 'meal-time-prompt');
          break;
        case 'deleteMeal':
          this.survey.deleteMeal(mealId);
          await this.nextPrompt();
          break;
        case 'selectMeal':
          this.setSelection({ element: { type: 'meal', mealId }, mode: 'manual' });
          await this.nextPrompt();
          break;
        default:
          console.warn(`Recall: Unknown action type: ${type}`);
      }
    },

    async foodAction(type: FoodActionType, foodId: string) {
      switch (type) {
        case 'changeFood':
          this.showFoodPrompt(foodId, 'foods', 'food-search-prompt');
          break;
        case 'editFood':
          this.survey.editFood(foodId);
          this.setSelection({ element: { type: 'food', foodId }, mode: 'auto' });
          await this.nextPrompt();
          break;
        case 'deleteFood':
          this.survey.deleteFood(foodId);
          await this.nextPrompt();
          break;
        case 'selectFood':
          this.setSelection({ element: { type: 'food', foodId }, mode: 'manual' });
          await this.nextPrompt();
          break;
        default:
          console.warn(`Recall: Unknown action type: ${type}`);
      }
    },

    async recallAction(action: GenericActionType, params?: object) {
      if (this.hasFinished)
        return;

      switch (action) {
        case 'addMeal':
          if (typeof params === 'object' && params !== null && Object.keys(params).length) {
            // TODO: validate params properly
            const { name, time, flags } = params as MealCreationState;
            this.survey.addMeal({ name, time, flags }, this.$i18n.locale);
            await this.nextPrompt();
          }
          else {
            this.showSurveyPrompt('preMeals', 'meal-add-prompt');
          }
          break;
      }
    },

    async nextPrompt() {
      const nextPrompt = this.recallController ? this.recallController.getNextPrompt() : undefined;

      if (nextPrompt === undefined) {
        // TODO: handle completion
        console.log('No prompts remaining');
        if (this.hasMeals)
          await this.recallAction('addMeal');
        else
          this.currentPrompt = null;
      }
      else {
        console.debug(
          `Switching prompt to: ${nextPrompt.prompt.id} (${nextPrompt.prompt.component})`,
        );

        this.currentPrompt = nextPrompt;
        this.currentPromptTimestamp = Date.now();

        // Strip Vue reactivity wrappers
        const promptInstance = JSON.parse(JSON.stringify(this.currentPrompt));
        const selection = JSON.parse(JSON.stringify(this.selection));
        const timeStamp = JSON.parse(JSON.stringify(this.currentPromptTimestamp));

        if (selection && promptInstance)
          history.pushState({ promptInstance, selection, timeStamp }, '', window.location.href);
      }
    },

    async next() {
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
      this.hideCurrentPrompt = true;

      await this.nextPrompt();

      this.hideCurrentPrompt = false;
    },

    async restart() {
      this.currentPrompt = null;
      await this.survey.cancelRecall();
      await this.$router.push({
        name: 'survey-home',
        params: { surveyId: this.$route.params.surveyId },
      });
    },
  },
});
