<template>
  <div>
    <div v-if="isEntryLoaded" class="pa-2">
      <v-form :readonly @keydown="clearError" @submit.prevent="submit">
        <div class="d-flex flex-column gr-4">
          <v-text-field
            v-model="data.code"
            :error-messages="errors.get('code')"
            :label="$t('fdbs.foods.code')"
            name="code"
          />
          <v-text-field
            v-model="data.englishName"
            :error-messages="errors.get('englishName')"
            :label="$t('fdbs.foods.englishName')"
            name="englishName"
          />
          <v-text-field
            v-model="data.name"
            :error-messages="errors.get('name')"
            :label="$t('fdbs.foods.name')"
            name="name"
          />
          <v-combobox
            v-model="data.tags"
            chips
            :closable-chips="!readonly"
            :error-messages="errors.get('tags')"
            :label="$t('fdbs.foods.tags')"
            multiple
            name="tags"
          />
          <language-selector
            v-model="data.altNames"
            border
            :label="$t('fdbs.foods.altNames')"
            :readonly
          >
            <template v-for="lang in Object.keys(data.altNames)" :key="lang" #[`lang.${lang}`]>
              <div v-for="(item, idx) in data.altNames[lang]" :key="item" class="mb-2">
                <v-text-field
                  v-model="data.altNames[lang][idx]"
                  density="compact"
                  :label="$t('fdbs.foods.altNames')"
                  :name="`altNames.${lang}.${idx}`"
                />
              </div>
            </template>
          </language-selector>
          <attribute-list
            v-model="data.attributes"
            :errors
            :readonly
          />
          <category-list
            v-model="data.parentCategories"
            border
            :code
            :errors
            :readonly
          />
          <nutrient-list
            v-model="data.nutrientRecords"
            :errors
            :nutrient-tables="refs?.nutrientTables ?? []"
            :readonly
          />
          <portion-size-method-list
            v-model="data.portionSizeMethods"
            :errors
            :readonly
          />
          <associated-food-list
            v-model="data.associatedFoods"
            :errors
            :food-id="entryId"
            :locale-id="code"
            :readonly
          />
          <div v-if="!readonly" class="d-flex gc-2">
            <v-btn color="secondary" type="submit" variant="outlined">
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
      </v-form>
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
import { ConfirmLeaveDialog } from '@intake24/admin/components/entry';
import {
  AssociatedFoodList,
  AttributeList,
  CategoryList,
  CopyEntryDialog,
  NutrientList,
  PortionSizeMethodList,
} from '@intake24/admin/components/fdbs';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useEntry, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import type {
  FoodDatabaseRefs,
  FoodEntry,
  FoodInput,
  LocaleEntry,
} from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/i18n';
import { ConfirmDialog } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

export default defineComponent({
  name: 'FoodEntry',

  components: {
    AssociatedFoodList,
    AttributeList,
    CategoryList,
    ConfirmDialog,
    ConfirmLeaveDialog,
    CopyEntryDialog,
    LanguageSelector,
    NutrientList,
    PortionSizeMethodList,
  },

  props: {
    id: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    entryId: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const http = useHttp();
    const router = useRouter();
    const { i18n } = useI18n();

    const loading = ref(false);
    const type = 'foods' as const;
    const entry = ref<FoodEntry | null>(null);
    const isEntryLoaded = computed(() => !!entry.value);

    const { refs } = useEntry<LocaleEntry, FoodDatabaseRefs>(props);
    const { clearError, form: { data, errors, put }, nonInputErrors, originalEntry, routeLeave, toForm } = useEntryForm<
      Required<FoodInput>,
      LocaleEntry
    >(props, {
      data: {
        code: '',
        englishName: '',
        name: '',
        altNames: {},
        attributes: {
          readyMealOption: null,
          reasonableAmount: null,
          sameAsBeforeOption: null,
          useInRecipes: null,
        },
        associatedFoods: [],
        nutrientRecords: [],
        parentCategories: [],
        portionSizeMethods: [],
        tags: [],
      },
      config: { extractNestedKeys: true },
    });

    const fetchCategoryOrFood = async (id: string, entryId: string) => {
      if (!entryId || entryId === 'no-category')
        return;

      loading.value = true;
      entry.value = null;

      try {
        const { data } = await http.get<FoodEntry>(`admin/fdbs/${id}/${type}/${entryId}`);

        toForm(data);
        entry.value = data;
      }
      finally {
        loading.value = false;
      }
    };

    const submit = async () => {
      const data = await put<FoodEntry>(`admin/fdbs/${props.id}/${type}/${props.entryId}`);
      toForm(data);

      const { name, name: englishName = 'record' } = data;

      useMessages().success(i18n.t('common.msg.updated', { name: name ?? englishName }));
    };

    const remove = async () => {
      await http.delete(`admin/fdbs/${props.id}/${type}/${props.entryId}`);

      useMessages().success(i18n.t('common.msg.deleted', { name: entry.value?.name }));

      const parentEntryId = entry.value?.parentCategories?.at(0)?.id;
      if (parentEntryId) {
        await router.push({ name: `fdbs-categories`, params: { id: props.id, entryId: parentEntryId } });
      }
      else {
        await router.push({ name: 'fdbs-food-list', params: { id: props.id } });
      }
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
      entry,
      refs,
      clearError,
      data,
      errors,
      nonInputErrors,
      originalEntry,
      routeLeave,
      toForm,
      isEntryLoaded,
      remove,
      submit,
      type,
    };
  },
});
</script>
