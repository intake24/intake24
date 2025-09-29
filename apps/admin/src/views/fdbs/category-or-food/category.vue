<template>
  <div>
    <div v-if="isEntryLoaded" class="pa-2">
      <v-form :readonly @keydown="clearError" @submit.prevent="submit">
        <div class="d-flex flex-column gr-4">
          <v-text-field
            v-model="data.code"
            :error-messages="errors.get('code')"
            hide-details="auto"
            :label="$t('fdbs.categories.code')"
            name="code"
            variant="outlined"
          />
          <v-text-field
            v-model="data.englishName"
            :error-messages="errors.get('englishName')"
            hide-details="auto"
            :label="$t('fdbs.categories.englishName')"
            name="englishName"
            variant="outlined"
          />
          <v-text-field
            v-model="data.name"
            :error-messages="errors.get('name')"
            hide-details="auto"
            :label="$t('fdbs.categories.name')"
            name="name"
            variant="outlined"
          />
          <v-switch
            v-model="data.hidden"
            :error-messages="errors.get('hidden')"
            hide-details="auto"
            :label="$t('fdbs.categories.hidden')"
            name="hidden"
            @update:model-value="errors.clear('hidden')"
          />
          <v-combobox
            v-model="data.tags"
            chips
            :closable-chips="!readonly"
            :error-messages="errors.get('tags')"
            hide-details="auto"
            :label="$t('fdbs.categories.tags')"
            multiple
            name="tags"
            variant="outlined"
          />
          <language-selector
            v-model="data.altNames"
            border
            :label="$t('fdbs.categories.altNames')"
            :readonly
          >
            <template v-for="lang in Object.keys(data.altNames)" :key="lang" #[`lang.${lang}`]>
              <div v-for="(item, idx) in data.altNames[lang]" :key="item" class="mb-2">
                <v-text-field
                  v-model="data.altNames[lang][idx]"
                  density="compact"
                  hide-details="auto"
                  :label="$t('fdbs.categories.altNames')"
                  :name="`altNames.${lang}.${idx}`"
                  variant="outlined"
                />
              </div>
            </template>
          </language-selector>
          <attribute-list
            v-model="data.attributes"
            class="mb-6"
            :errors
            :readonly
          />
          <category-list
            v-model="data.parentCategories"
            border
            class="mb-6"
            :errors
            :locale-id="id"
            :readonly
          />
          <portion-size-method-list
            v-model="data.portionSizeMethods"
            class="mb-6"
            :errors
            :locale-id="id"
            :readonly
          />
        </div>
        <div v-if="!readonly" class="d-flex gc-2">
          <v-btn color="secondary" type="submit" variant="outlined">
            <v-icon icon="$save" start />{{ $t(`common.action.save`) }}
          </v-btn>
          <copy-entry-dialog v-bind="{ entryId, localeId: id, type }" />
          <v-spacer />
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
import { onBeforeRouteUpdate } from 'vue-router';
import { ConfirmLeaveDialog } from '@intake24/admin/components/entry';
import {
  AttributeList,
  CategoryList,
  CopyEntryDialog,
  PortionSizeMethodList,
} from '@intake24/admin/components/fdbs';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useEntry, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import type {
  CategoryEntry,
  FoodDatabaseRefs,
  LocaleEntry,
} from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/i18n';
import { useMessages } from '@intake24/ui/stores';

export default defineComponent({
  name: 'CategoryEntry',

  components: {
    AttributeList,
    CategoryList,
    ConfirmLeaveDialog,
    CopyEntryDialog,
    LanguageSelector,
    PortionSizeMethodList,
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
    readonly: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const http = useHttp();
    const { i18n } = useI18n();

    const { entry: localeEntry } = useEntry<LocaleEntry>(props);

    const loading = ref(false);
    const type = 'categories' as const;
    const entry = ref<CategoryEntry | null>(null);
    const isEntryLoaded = computed(() => !!entry.value);

    useEntry<LocaleEntry, FoodDatabaseRefs>(props);
    const { clearError, form: { data, errors, put }, nonInputErrors, originalEntry, routeLeave, toForm } = useEntryForm<
      any,
      LocaleEntry
    >(props, {
      data: {
        code: '',
        englishName: '',
        name: '',
        hidden: false,
        attributes: {
          readyMealOption: null,
          reasonableAmount: null,
          sameAsBeforeOption: null,
          useInRecipes: null,
        },
        altNames: {},
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
        const { data } = await http.get<CategoryEntry>(
          `admin/fdbs/${props.id}/${type}/${entryId}`,
        );

        toForm(data);
        entry.value = data;
      }
      finally {
        loading.value = false;
      }
    };

    const submit = async () => {
      const data = await put<CategoryEntry>(
        `admin/fdbs/${props.id}/${type}/${props.entryId}`,
      );
      toForm(data);

      const { name, englishName } = data;

      useMessages().success(i18n.t('common.msg.updated', { name: name ?? englishName }));
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
      clearError,
      data,
      errors,
      nonInputErrors,
      originalEntry,
      routeLeave,
      toForm,
      isEntryLoaded,
      submit,
      type,
    };
  },
});
</script>
