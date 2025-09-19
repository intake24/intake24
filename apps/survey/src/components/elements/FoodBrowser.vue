<template>
  <component :is="dialog ? `food-browser-dialog` : `v-card`" v-model="dialog" class="py-2" :flat="!dialog">
    <food-search-hints
      class="mb-4"
      :model-value="searchTerm"
      :prompt
    >
      <v-text-field
        ref="searchRef"
        v-model="searchTerm"
        clearable
        flat
        hide-details
        :label="promptI18n.search"
        :placeholder="promptI18n.search"
        prepend-inner-icon="$search"
        :rounded="dialog ? 'pill' : undefined"
        @focus="openInDialog"
      />
    </food-search-hints>
    <v-switch
      v-if="rootCategory && rootCategoryToggleable"
      v-model="limitToRootCategory"
      class="root-category-toggle"
      density="compact"
      hide-details="auto"
      :label="$t('prompts.foodSearch.rootCategoryToggle', { category: rootCategoryName })"
    />
    <v-alert
      v-if="rootCategory && !rootCategoryToggleable"
      border="start"
      class="mb-4"
      density="compact"
      icon="fas fa-lightbulb"
      rounded="lg"
      :text="$t('prompts.foodSearch.rootCategory', { category: rootCategoryName })"
      type="warning"
    />
    <template v-if="recipeBuilderToggle">
      <v-btn
        v-for="recipeBuilderFood in recipeBuilderFoods"
        :key="recipeBuilderFood.code"
        :block="$vuetify.display.mobile"
        class="mb-4"
        color="primary"
        :disabled="!recipeBuilderToggle"
        size="large"
        variant="outlined"
        @click.stop="recipeBuilder(recipeBuilderFood.code)"
      >
        {{ $t(`prompts.recipeBuilder.label`, { searchTerm: recipeBuilderFood?.name }) }}
      </v-btn>
    </template>
    <v-tabs-window v-show="type === 'foodSearch' || dialog || !showInDialog" v-model="tab" v-scroll="onScroll">
      <v-tabs-window-item value="browse">
        <v-alert
          v-if="requestFailed"
          class="mb-4"
          type="error"
        >
          {{ $t('common.errors.500') }}
          <template #append>
            <v-btn @click="browseCategory(retryCode, false)">
              {{ $t('common.errors.retry') }}
            </v-btn>
          </template>
        </v-alert>
        <v-btn
          v-if="navigationHistory.length"
          class="btn-truncate"
          size="large"
          variant="text"
          @click="navigateBack"
        >
          <v-icon icon="fas fa-turn-up fa-flip-horizontal" start />
          {{ promptI18n.back }}
        </v-btn>
        <image-placeholder v-if="requestInProgress" class="my-6" />
        <category-contents-view
          v-if="currentCategoryContents && !requestInProgress"
          :allow-thumbnails="prompt.allowThumbnails"
          :categories-first="prompt.categoriesFirst.browse"
          :contents="currentCategoryContents"
          :enable-grid="prompt.enableGrid"
          :grid-threshold="prompt.gridThreshold"
          :i18n="promptI18n"
          :type="type"
          @category-selected="categorySelected"
          @food-selected="foodSelected"
        />
      </v-tabs-window-item>
      <v-tabs-window-item value="search">
        <image-placeholder v-if="requestInProgress" class="my-6" />
        <category-contents-view
          v-if="!requestInProgress"
          :allow-thumbnails="prompt.allowThumbnails"
          :categories-first="prompt.categoriesFirst.search"
          :contents="searchContents"
          :enable-grid="prompt.enableGrid"
          :grid-threshold="prompt.gridThreshold"
          :i18n="promptI18n"
          layout="grid"
          :percent-scrolled="percentScrolled"
          :search-count="searchCount"
          :search-term="searchTerm ?? undefined"
          :type="type"
          @category-selected="categorySelected"
          @food-selected="foodSelected"
        />
      </v-tabs-window-item>
    </v-tabs-window>
    <div
      v-if="type === 'foodSearch' || dialog || !showInDialog"
      class="d-flex flex-column flex-md-row py-4 ga-2"
    >
      <v-btn
        v-if="type === 'foodSearch' && tab === 'search'"
        color="primary"
        :disabled="missingDialog"
        size="large"
        :title="promptI18n.browse"
        variant="outlined"
        @click.stop="browseRootCategory"
      >
        {{ promptI18n.browse }}
      </v-btn>
      <v-btn
        class="btn-truncate"
        color="primary"
        :disabled="missingDialog"
        size="large"
        :title="promptI18n['missing.label']"
        variant="outlined"
        @click.stop="openMissingDialog"
      >
        {{ promptI18n['missing.label'] }}
      </v-btn>
      <v-btn
        v-if="type === 'recipeBuilder' && !requiredToFill"
        class="btn-truncate"
        color="primary"
        :disabled="missingDialog"
        size="large"
        :title="promptI18n['missing.irrelevantIngredient']"
        variant="outlined"
        @click.stop="skipTheStep"
      >
        {{ promptI18n['missing.irrelevantIngredient'] }}
      </v-btn>
    </div>
  </component>
  <missing-food-panel
    v-model="missingDialog"
    :class="{ 'mt-4': $vuetify.display.mobile }"
    :i18n="promptI18n"
    @cancel="closeMissingDialog"
    @confirm="foodMissing"
  />
</template>

<script lang='ts' setup>
import type { PropType } from 'vue';
import type { VTextField } from 'vuetify/components';
import { watchDebounced } from '@vueuse/core';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useGoTo } from 'vuetify';
import { VCard } from 'vuetify/components';
import type { Prompts } from '@intake24/common/prompts';
import type { PromptSection } from '@intake24/common/surveys';
import type { RecipeFood } from '@intake24/common/types';
import type {
  CategoryContents,
  CategoryHeader,
  FoodHeader,
  FoodSearchResponse,
} from '@intake24/common/types/http';
import { useI18n } from '@intake24/i18n';
import { usePromptUtils } from '@intake24/survey/composables';
import { categoriesService, foodsService } from '@intake24/survey/services';
import { sendGtmEvent } from '@intake24/survey/util';
import CategoryContentsView from './CategoryContentsView.vue';
import FoodBrowserDialog from './FoodBrowserDialog.vue';
import FoodSearchHints from './FoodSearchHints.vue';
import ImagePlaceholder from './ImagePlaceholder.vue';
import MissingFoodPanel from './MissingFoodPanel.vue';

defineOptions({
  name: 'FoodBrowser',
  components: { FoodBrowserDialog, VCard },
});

const props = defineProps({
  inDialog: {
    type: Boolean,
    default: true,
  },
  localeId: {
    type: String,
    required: true,
  },
  surveySlug: {
    type: String,
  },
  rootCategory: {
    type: String,
  },
  rootCategoryToggleable: {
    type: Boolean,
    default: false,
  },
  includeHidden: {
    type: Boolean,
    default: false,
  },
  prompt: {
    type: Object as PropType<
      Prompts['associated-foods-prompt' | 'general-associated-foods-prompt' | 'food-search-prompt' | 'recipe-builder-prompt']
    >,
    required: true,
  },
  section: {
    type: String as PropType<PromptSection>,
    required: true,
  },
  modelValue: {
    type: String as PropType<string | null>,
    default: '',
  },
  stepName: {
    type: String,
    default: '',
  },
  requiredToFill: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['action', 'foodSelected', 'foodMissing', 'recipeBuilder', 'update:modelValue', 'foodSkipped']);
const goTo = useGoTo();

const { recipeBuilderEnabled, translatePrompt, type } = usePromptUtils(props, { emit });
const { i18n: { t } } = useI18n();

const searchTerm = ref(props.modelValue);
const searchRef = ref<InstanceType<typeof VTextField>>();
const searchResults = ref<FoodSearchResponse>({ foods: [], categories: [] });

const navigationHistory = ref<('search' | CategoryHeader)[]>([]);
const retryCode = ref(props.rootCategory);
const currentCategoryContents = ref<CategoryContents | undefined>(undefined);

const requestInProgress = ref(true);
const requestFailed = ref(false);
const recipeBuilderFoods = ref<FoodHeader[]>([]);
const recipeFoods = ref<RecipeFood[]>([]);
const recipeBuilderToggle = ref(false);
const tab = ref<'browse' | 'search'>('browse');
const searchCount = ref(1);
const percentScrolled = ref(0);
const rootCategoryName = ref('...');

function onScroll(event: Event) {
  if (event.target instanceof Document) {
    const scrollTop = event.target.documentElement.scrollTop;
    const totalHeight = event.target.documentElement.scrollHeight;
    const clientHeight = event.target.documentElement.clientHeight;

    const percentages = [25, 50, 75, 90];
    percentages.forEach((percentage) => {
      const threshold = (percentage / 100) * (totalHeight - clientHeight);
      if ((percentScrolled.value < percentage) && (scrollTop >= threshold)) {
        percentScrolled.value = percentage;
        console.debug(`Scrolled to ${percentScrolled.value}%`);
      }
    });
  }
}

const showInDialog = computed(
  () => props.inDialog && searchRef.value?.$vuetify.display.mobile,
);

const dialog = ref(false);

const backCategoryLabel = computed(() => {
  if (!navigationHistory.value.length)
    return '??';

  const last = navigationHistory.value[navigationHistory.value.length - 1];

  return last === 'search' ? t(`prompts.${type.value}.results`).toLowerCase() : last.name;
});

const promptI18n = computed(() => {
  return {
    ...translatePrompt(
      [
        'browse',
        'search',
        'relatedCategories',
        'showLess',
        'showAll',
        'root',
        'back',
        'none',
        'refine',
        type.value !== 'recipeBuilder' ? 'pizza' : undefined,
        'missing.label',
        'missing.description',
        'missing.report',
        'missing.tryAgain',
        type.value === 'recipeBuilder' ? 'missing.irrelevantIngredient' : undefined,
      ].filter(Boolean) as string[],
      {
        back: { category: backCategoryLabel.value },
        browse: { category: props.stepName },
      },
    ),
  };
});

const limitToRootCategory = ref(true);

const rootHeader = computed(() => ({
  code: props.rootCategory ?? '',
  name: props.rootCategory ?? promptI18n.value.root,
}));

const searchContents = computed<CategoryContents>(() => ({
  header: rootHeader.value,
  foods: searchResults.value.foods,
  subcategories: searchResults.value.categories,
}));

async function openInDialog() {
  if (!showInDialog.value || dialog.value)
    return;

  dialog.value = true;

  await nextTick();
  searchRef.value?.focus();
}

function closeInDialog() {
  dialog.value = false;
}

const missingDialog = ref(false);

function openMissingDialog() {
  missingDialog.value = true;
  dialog.value = false;
}

async function closeMissingDialog() {
  if (!searchRef.value)
    return;

  missingDialog.value = false;

  setTimeout(async () => {
    if (!searchRef.value)
      return;

    await goTo(searchRef.value, { duration: 500 });

    searchRef.value.focus();
  }, 100);
}

async function browseCategory(categoryCode: string | undefined, makeHistoryEntry: boolean) {
  requestInProgress.value = true;
  retryCode.value = categoryCode;
  tab.value = 'browse';

  try {
    const contents = await categoriesService.contents(props.localeId, categoryCode);

    requestInProgress.value = false;
    requestFailed.value = false;

    const header = contents.header.code ? contents.header : rootHeader.value;

    if (makeHistoryEntry) {
      if (currentCategoryContents.value !== undefined)
        navigationHistory.value.push(currentCategoryContents.value.header);
      else
        navigationHistory.value.push('search');
    }

    currentCategoryContents.value = { ...contents, header };
  }
  catch {
    requestInProgress.value = false;
    requestFailed.value = true;
  }
}

function browseRootCategory() {
  browseCategory(limitToRootCategory.value ? props.rootCategory : undefined, true);
}

async function recipeBuilderDetected(foods: FoodHeader[]) {
  foods.forEach(async (food) => {
    const recipeFood: RecipeFood = await foodsService.getRecipeFood(props.localeId, food.code);
    recipeFoods.value.push(recipeFood);
  });
  recipeBuilderToggle.value = true;
}

async function search() {
  if (!searchTerm.value)
    return;
  percentScrolled.value = 0;
  requestInProgress.value = true;
  recipeBuilderToggle.value = false;
  recipeBuilderFoods.value = [];
  searchResults.value = { foods: [], categories: [] };

  try {
    if (props.surveySlug !== undefined) {
      searchResults.value = await foodsService.search(props.surveySlug, searchTerm.value, {
        recipe: false,
        category: limitToRootCategory.value ? props.rootCategory : undefined,
        hidden: props.includeHidden,
      });
      searchResults.value.foods = searchResults.value.foods.filter(
        (food) => {
          if (food.code.charAt(0) === '$') {
            recipeBuilderFoods.value.push(food);
            return false;
          }
          return true;
        },
      );
      sendGtmEvent({
        event: 'foodSearch',
        scheme_prompts: 'foods',
        search_term: searchTerm.value,
        search_term_order: searchCount.value,
        search_results_count: searchResults.value.foods.length,
        percent_scrolled: percentScrolled.value,
      });
      if (recipeBuilderEnabled.value && recipeBuilderFoods.value.length > 0 && (!props.rootCategory || !limitToRootCategory.value))
        await recipeBuilderDetected(recipeBuilderFoods.value);
      requestFailed.value = false;
    }
    else {
      console.error('Expected survey parameters to be loaded at this point');
      requestFailed.value = true;
    }
  }
  catch {
    requestFailed.value = true;
  }
  finally {
    requestInProgress.value = false;
  }
}

function categorySelected(category: CategoryHeader) {
  browseCategory(category.code, true);
}

function foodSelected(food: FoodHeader) {
  closeInDialog();
  emit('foodSelected', { ...food, searchTerm: searchTerm.value });
}

function foodMissing() {
  closeInDialog();
  emit('foodMissing', searchTerm.value);
}

function skipTheStep() {
  closeInDialog();
  emit('foodSkipped', null);
}

function recipeBuilder(key: string) {
  closeInDialog();
  emit('recipeBuilder', recipeFoods.value.find(food => food.code === key));
}

function navigateBack() {
  if (navigationHistory.value.length === 0) {
    console.warn('Navigation history is empty');
    return;
  }

  const lastItem = navigationHistory.value[navigationHistory.value.length - 1];
  navigationHistory.value = navigationHistory.value.slice(
    0,
    navigationHistory.value.length - 1,
  );

  if (lastItem === 'search') {
    tab.value = 'search';
    currentCategoryContents.value = undefined;
  }
  else {
    tab.value = 'browse';
    browseCategory(lastItem.code, false);
  }
}

onMounted(async () => {
  if (props.rootCategory !== undefined) {
    categoriesService.header(props.localeId, props.rootCategory).then(header => rootCategoryName.value = header.name);
  }

  if (searchTerm.value) {
    await search();
    tab.value = 'search';
    return;
  }

  await browseCategory(props.rootCategory, false);
});

watchDebounced(
  [searchTerm, limitToRootCategory],
  async () => {
    emit('update:modelValue', searchTerm.value ?? '');

    if (searchTerm.value) {
      searchCount.value++;
      await search();
      currentCategoryContents.value = undefined;
      navigationHistory.value = [];
      tab.value = 'search';
      percentScrolled.value = 0;
      return;
    }

    if (
      !currentCategoryContents.value
      || props.rootCategory !== currentCategoryContents.value.header.code
    ) {
      await browseCategory(props.rootCategory, true);
    }
  },
  { debounce: 500, maxWait: 2000 },
);
</script>

<style lang='scss'>
.root-category-toggle {
  margin-top: -1em;
}
</style>
