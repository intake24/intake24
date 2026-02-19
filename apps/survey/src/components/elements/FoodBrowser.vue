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
    <template v-if="foodBuilders.detected.value">
      <v-row
        class="mb-4"
        justify="center"
      >
        <v-col
          v-for="builder in foodBuilders.builders.value"
          :key="builder.code"
          cols="12"
          md="auto"
          sm="6"
        >
          <v-card
            class="d-flex pa-4"
            :class="foodBuilders.exclusive.value ? 'flex-column align-center justify-center ga-4' : 'flex-row align-center ga-2'"
            color="primary"
            variant="tonal"
            @click.stop="foodBuilder(builder)"
          >
            <v-icon
              v-if="foodBuilders.icons.value[builder.code]"
              :icon="foodBuilders.icons.value[builder.code]"
              :size="foodBuilders.exclusive.value ? 100 : 30"
              :start="!foodBuilders.exclusive.value"
            />
            <span class="text-h5 font-weight-medium">
              {{ $t(`prompts.recipeBuilder.label`, { searchTerm: builder?.name }) }}
            </span>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <template v-if="!foodBuilders.exclusive.value">
      <v-tabs-window
        v-show="type === 'foodSearch' || dialog || !showInDialog"
        v-model="tab"
        v-scroll="onScroll"
      >
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
    </template>
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

import type { FoodBrowser, FoodSearchHint, Prompt } from '@intake24/common/prompts';
import type { PromptSection } from '@intake24/common/surveys';
import type { CategoryContents, CategoryHeader, FoodBuilder, FoodHeader, FoodSearchResponse } from '@intake24/common/types/http';

import { watchDebounced } from '@vueuse/core';
import { computed, nextTick, onMounted, ref, toRef } from 'vue';
import { useGoTo } from 'vuetify';
import { VCard } from 'vuetify/components';

import { usePromptUtils } from '@intake24/survey/composables';
import { categoriesService, foodsService } from '@intake24/survey/services';
import { sendGtmEvent } from '@intake24/survey/util';
import { useI18n } from '@intake24/ui';

import CategoryContentsView from './CategoryContentsView.vue';
import FoodBrowserDialog from './FoodBrowserDialog.vue';
import FoodSearchHints from './FoodSearchHints.vue';
import ImagePlaceholder from './ImagePlaceholder.vue';
import MissingFoodPanel from './MissingFoodPanel.vue';
import { useFoodBuilders } from './use-food-builders.ts';

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
    type: Object as PropType<Prompt & FoodBrowser & { hints: FoodSearchHint[] }>,
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

const emit = defineEmits(['action', 'foodSelected', 'foodMissing', 'foodBuilder', 'update:modelValue', 'foodSkipped']);
const goTo = useGoTo();

const { foodBuilderEnabled, translatePrompt, type } = usePromptUtils(props, { emit });
const { i18n: { t } } = useI18n();

const searchTerm = ref(props.modelValue);
const searchRef = ref<InstanceType<typeof VTextField>>();
const searchResults = ref<FoodSearchResponse>({ foods: [], categories: [] });

const navigationHistory = ref<('search' | CategoryHeader)[]>([]);
const retryCode = ref(props.rootCategory);
const currentCategoryContents = ref<CategoryContents | undefined>(undefined);

const requestInProgress = ref(true);
const requestFailed = ref(false);

const tab = ref<'browse' | 'search'>('browse');
const searchCount = ref(1);
const percentScrolled = ref(0);
const rootCategoryName = ref('...');

const foodBuilders = useFoodBuilders({ localeId: toRef(props, 'localeId'), enabled: foodBuilderEnabled });

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

  const last = navigationHistory.value.at(-1);

  return last === 'search' ? t(`prompts.${type.value}.results`).toLowerCase() : last?.name ?? '??';
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
  id: '',
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

async function search() {
  if (!searchTerm.value)
    return;

  percentScrolled.value = 0;
  requestInProgress.value = true;
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
            foodBuilders.foods.value.push(food);
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

      if (!props.rootCategory || !limitToRootCategory.value)
        await foodBuilders.fetch();

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

function foodBuilder(builder: FoodBuilder) {
  closeInDialog();
  emit('foodBuilder', builder);
}

function navigateBack() {
  if (navigationHistory.value.length === 0) {
    console.warn('Navigation history is empty');
    return;
  }

  const lastItem = navigationHistory.value.at(-1);
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
    browseCategory(lastItem?.code, false);
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

    foodBuilders.reset();

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
