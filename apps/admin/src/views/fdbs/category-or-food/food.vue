<template>
  <div>
    <div v-if="isEntryLoaded">
      <!-- Sticky context header -->
      <div class="food-context-header" style="position: sticky; top: 0; z-index: 5; background: rgb(var(--v-theme-surface));">
        <v-toolbar border color="grey-lighten-5" density="compact" flat>
          <v-chip class="mr-2" size="small" variant="outlined">
            {{ data.main.code }}
          </v-chip>
          <v-toolbar-title class="text-body-1">
            {{ data.name || data.main.name }}
          </v-toolbar-title>
        </v-toolbar>
      </div>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card border class="mb-6" flat>
          <v-toolbar color="grey-lighten-4">
            <v-toolbar-title class="font-weight-medium">
              {{ $t('fdbs.foods.global._') }}
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="data.main.code"
                  :disabled="!globalEdit"
                  :error-messages="errors.get('main.code')"
                  hide-details="auto"
                  :label="$t('fdbs.foods.global.code')"
                  name="main.code"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="data.main.name"
                  counter
                  :disabled="!globalEdit"
                  :error-messages="errors.get('main.name')"
                  hide-details="auto"
                  :label="$t('fdbs.foods.global.name')"
                  name="main.name"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <select-resource
                  v-model="data.main.foodGroupId"
                  :disabled="!globalEdit"
                  :error-messages="errors.get('main.foodGroupId')"
                  :initial-item="entry?.main?.foodGroup"
                  :label="$t('fdbs.foods.global.foodGroup')"
                  name="main.foodGroup"
                  resource="food-groups"
                  @update:model-value="errors.clear('main.foodGroupId')"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card border class="mb-6" flat>
          <v-toolbar color="grey-lighten-4">
            <v-toolbar-title class="font-weight-medium">
              {{ $t('fdbs.foods.local._') }}
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="data.name"
                  :error-messages="errors.get('name')"
                  hide-details="auto"
                  :label="$t('fdbs.foods.local.name')"
                  name="name"
                  variant="outlined"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="data.tags"
                  chips
                  closable-chips
                  :error-messages="errors.get('tags')"
                  hide-details="auto"
                  :label="$t('fdbs.foods.local.tags')"
                  multiple
                  name="tags"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <!-- Collapsible sections -->
        <v-expansion-panels v-model="expandedPanels" class="mb-6" multiple>
          <!-- Alternative Names -->
          <v-expansion-panel value="altNames">
            <v-expansion-panel-title>
              <v-icon class="mr-2" size="small">
                $edit
              </v-icon>
              {{ $t('fdbs.foods.local.altNames._') }}
              <v-chip v-if="altNamesCount" class="ml-2" size="x-small">
                {{ altNamesCount }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <alt-names-list
                v-model="data.altNames"
                :food-name="data.name || data.main.name"
                :language-code="localeEntry?.foodIndexLanguageBackendId ?? 'en'"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Locales -->
          <v-expansion-panel value="locales">
            <v-expansion-panel-title>
              <v-icon class="mr-2" size="small">
                $locales
              </v-icon>
              {{ $t('fdbs.locales.title') }}
              <v-chip v-if="data.main.locales.length" class="ml-2" size="x-small">
                {{ data.main.locales.length }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <locale-list
                v-model="data.main.locales"
                :disabled="!globalEdit"
                :errors="errors"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Attributes -->
          <v-expansion-panel value="attributes">
            <v-expansion-panel-title>
              <v-icon class="mr-2" size="small">
                $options
              </v-icon>
              {{ $t('fdbs.attributes.title') }}
              <v-chip v-if="hasAttributeErrors" class="ml-2" color="error" size="x-small">
                <v-icon size="x-small" start>
                  $warning
                </v-icon>
                {{ attributeErrorCount }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <attribute-list
                v-model="data.main.attributes"
                :disabled="!globalEdit"
                :errors="errors"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Parent Categories -->
          <v-expansion-panel value="categories">
            <v-expansion-panel-title>
              <v-icon class="mr-2" size="small">
                $categories
              </v-icon>
              {{ $t('fdbs.foods.parentCategories._') }}
              <v-chip v-if="data.main.parentCategories.length" class="ml-2" size="x-small">
                {{ data.main.parentCategories.length }}
              </v-chip>
              <v-chip v-if="hasCategoryErrors" class="ml-1" color="error" size="x-small">
                <v-icon size="x-small" start>
                  $warning
                </v-icon>
                {{ categoryErrorCount }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <category-list
                v-model="data.main.parentCategories"
                :disabled="!globalEdit"
                :errors="errors"
                :locale-id="id"
                outlined
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Nutrient Records -->
          <v-expansion-panel value="nutrients">
            <v-expansion-panel-title>
              <v-icon class="mr-2" size="small">
                $nutrient-types
              </v-icon>
              {{ $t('fdbs.nutrients.title') }}
              <v-chip v-if="data.nutrientRecords.length" class="ml-2" size="x-small">
                {{ data.nutrientRecords.length }}
              </v-chip>
              <v-chip v-if="hasNutrientErrors" class="ml-1" color="error" size="x-small">
                <v-icon size="x-small" start>
                  $warning
                </v-icon>
                {{ nutrientErrorCount }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <nutrient-list
                v-model="data.nutrientRecords"
                :errors="errors"
                :nutrient-tables="refs?.nutrientTables ?? []"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Portion Size Methods -->
          <v-expansion-panel value="portionSizes">
            <v-expansion-panel-title>
              <v-icon class="mr-2" size="small">
                fas fa-balance-scale
              </v-icon>
              {{ $t('fdbs.portionSizes.title') }}
              <v-chip v-if="data.portionSizeMethods.length" class="ml-2" size="x-small">
                {{ data.portionSizeMethods.length }}
              </v-chip>
              <v-chip v-if="hasPortionSizeErrors" class="ml-1" color="error" size="x-small">
                <v-icon size="x-small" start>
                  $warning
                </v-icon>
                {{ portionSizeErrorCount }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <portion-size-method-list
                v-model="data.portionSizeMethods"
                :errors="errors"
                :locale-id="id"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Associated Foods -->
          <v-expansion-panel value="associatedFoods">
            <v-expansion-panel-title>
              <v-icon class="mr-2" size="small">
                $foods
              </v-icon>
              {{ $t('fdbs.associatedFoods.title') }}
              <v-chip v-if="data.associatedFoods.length" class="ml-2" size="x-small">
                {{ data.associatedFoods.length }}
              </v-chip>
              <v-chip v-if="hasAssociatedFoodErrors" class="ml-1" color="error" size="x-small">
                <v-icon size="x-small" start>
                  $warning
                </v-icon>
                {{ associatedFoodErrorCount }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <associated-food-list
                v-model="data.associatedFoods"
                :errors="errors"
                :food-code="data.main.code"
                :locale-id="id"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-form>
      <!-- Sticky action footer -->
      <div class="food-actions-footer" style="position: sticky; bottom: 0; z-index: 5; background: rgb(var(--v-theme-surface)); border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));">
        <div class="d-flex gc-2 pa-3">
          <v-btn color="secondary" type="submit" variant="outlined" @click="submit">
            <v-icon icon="$save" start />{{ $t(`common.action.save`) }}
          </v-btn>
          <copy-entry-dialog v-bind="{ entryId, localeId: id, type }" />
          <v-spacer />
          <confirm-dialog
            color="error"
            icon-left="$delete"
            :label="$t('common.action.delete')"
            @confirm="remove"
          >
            {{ $t('common.action.confirm.delete', { name: entry?.name }) }}
          </confirm-dialog>
        </div>
      </div>
    </div>
    <v-skeleton-loader
      v-else
      type="heading, list-item-three-line@3, actions"
    />
    <confirm-leave-dialog v-model="routeLeave" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { onBeforeRouteUpdate, useRouter } from 'vue-router';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { ConfirmLeaveDialog } from '@intake24/admin/components/entry';
import {
  AltNamesList,
  AssociatedFoodList,
  AttributeList,
  CategoryList,
  CopyEntryDialog,
  LocaleList,
  NutrientList,
  PortionSizeMethodList,
} from '@intake24/admin/components/fdbs';
import { useEntry, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { useUser } from '@intake24/admin/stores';
import type {
  FoodDatabaseRefs,
  FoodLocalEntry,
  FoodLocalInput,
  LocaleEntry,
} from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/i18n';
import { ConfirmDialog } from '@intake24/ui/components';
import { useMessages } from '@intake24/ui/stores';

export default defineComponent({
  name: 'FoodEntry',

  components: {
    AltNamesList,
    AssociatedFoodList,
    AttributeList,
    CategoryList,
    ConfirmDialog,
    ConfirmLeaveDialog,
    CopyEntryDialog,
    LocaleList,
    NutrientList,
    PortionSizeMethodList,
    SelectResource,
  },

  props: {
    id: {
      type: String,
      required: true,
    },
    entryId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const http = useHttp();
    const router = useRouter();
    const { i18n } = useI18n();
    const user = useUser();

    const { entry: localeEntry } = useEntry<LocaleEntry>(props);

    const loading = ref(false);
    const type = 'foods' as const;
    const entry = ref<FoodLocalEntry | null>(null);
    const globalEdit = computed(
      () => user.can('locales:food-list') || entry.value?.main?.locales?.length === 1,
    );
    const isEntryLoaded = computed(() => !!entry.value);

    // Expanded panels - most commonly edited sections open by default
    const expandedPanels = ref(['nutrients', 'portionSizes']);

    const { refs } = useEntry<LocaleEntry, FoodDatabaseRefs>(props);

    // Item counts for panel headers
    const altNamesCount = computed(() => {
      const altNames = data.altNames;
      if (!altNames || typeof altNames !== 'object')
        return 0;
      return Object.values(altNames).flat().length;
    });

    // Error indicators for panel headers
    const hasAttributeErrors = computed(() => errors.has('main.attributes*'));
    const attributeErrorCount = computed(() => errors.get('main.attributes*')?.length ?? 0);

    const hasCategoryErrors = computed(() => errors.has('main.parentCategories*'));
    const categoryErrorCount = computed(() => errors.get('main.parentCategories*')?.length ?? 0);

    const hasNutrientErrors = computed(() => errors.has('nutrientRecords*'));
    const nutrientErrorCount = computed(() => errors.get('nutrientRecords*')?.length ?? 0);

    const hasPortionSizeErrors = computed(() => errors.has('portionSizeMethods*'));
    const portionSizeErrorCount = computed(() => errors.get('portionSizeMethods*')?.length ?? 0);

    const hasAssociatedFoodErrors = computed(() => errors.has('associatedFoods*'));
    const associatedFoodErrorCount = computed(() => errors.get('associatedFoods*')?.length ?? 0);
    const { clearError, form: { data, errors, put }, nonInputErrors, originalEntry, routeLeave, toForm } = useEntryForm<
      FoodLocalInput,
      LocaleEntry
    >(props, {
      data: {
        name: '',
        main: {
          name: '',
          code: '',
          foodGroupId: '0',
          attributes: {
            readyMealOption: null,
            reasonableAmount: null,
            sameAsBeforeOption: null,
            useInRecipes: null,
          },
          locales: [],
          parentCategories: [],
        },
        tags: [],
        altNames: {},
        nutrientRecords: [],
        portionSizeMethods: [],
        associatedFoods: [],
      },
      config: { extractNestedKeys: true },
    });

    const fetchCategoryOrFood = async (id: string, entryId: string) => {
      if (!entryId || entryId === 'no-category')
        return;

      loading.value = true;
      entry.value = null;

      try {
        const { data } = await http.get<FoodLocalEntry>(`admin/fdbs/${id}/${type}/${entryId}`);

        toForm(data);
        entry.value = data;
      }
      finally {
        loading.value = false;
      }
    };

    const submit = async () => {
      const data = await put<FoodLocalEntry>(`admin/fdbs/${props.id}/${type}/${props.entryId}`);
      toForm(data);

      const { name, main: { name: englishName = 'record' } = {} } = data;

      useMessages().success(i18n.t('common.msg.updated', { name: name ?? englishName }));
    };

    const remove = async () => {
      await http.delete(`admin/fdbs/${props.id}/${type}/${props.entryId}`);

      useMessages().success(
        i18n.t('common.msg.deleted', { name: entry.value?.main?.name }),
      );

      await router.push({
        name: `fdbs-categories`,
        params: {
          id: props.id,
          // @ts-expect-error missing typed locals
          entryId: entry.value?.main?.parentCategories?.at(0)?.locals?.at(0)?.id ?? 'no-category',
        },
      });
    };

    onMounted(async () => {
      await fetchCategoryOrFood(props.id, props.entryId);
    });

    onBeforeRouteUpdate(async (to, from, next) => {
      if (to.params.entryId !== from.params.entryId)
        await fetchCategoryOrFood(to.params.id.toString(), to.params.entryId.toString());

      next();
    });

    return {
      localeEntry,
      entry,
      refs,
      clearError,
      data,
      errors,
      nonInputErrors,
      originalEntry,
      routeLeave,
      toForm,
      globalEdit,
      isEntryLoaded,
      remove,
      submit,
      type,
      // Collapsible panel state
      expandedPanels,
      // Item counts
      altNamesCount,
      // Error indicators
      hasAttributeErrors,
      attributeErrorCount,
      hasCategoryErrors,
      categoryErrorCount,
      hasNutrientErrors,
      nutrientErrorCount,
      hasPortionSizeErrors,
      portionSizeErrorCount,
      hasAssociatedFoodErrors,
      associatedFoodErrorCount,
    };
  },
});
</script>
