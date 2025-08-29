<template>
  <div>
    <div v-if="isEntryLoaded" flat>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card border class="mb-6" flat>
          <v-toolbar color="grey-lighten-4">
            <v-toolbar-title class="font-weight-medium">
              {{ $t('fdbs.categories.global._') }}
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
                  :label="$t('fdbs.categories.global.code')"
                  name="main.code"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="data.main.name"
                  :disabled="!globalEdit"
                  :error-messages="errors.get('main.name')"
                  hide-details="auto"
                  :label="$t('fdbs.categories.global.name')"
                  name="main.name"
                  variant="outlined"
                />
              </v-col>
              <v-col align-self="center" cols="12" md="6">
                <v-switch
                  v-model="data.main.isHidden"
                  class="mt-0"
                  :disabled="!globalEdit"
                  :error-messages="errors.get('main.isHidden')"
                  hide-details="auto"
                  :label="$t('fdbs.categories.global.isHidden')"
                  name="main.isHidden"
                  @update:model-value="errors.clear('allowGenUsers')"
                />
              </v-col>
              <v-col cols="12">
                <language-selector
                  v-model="data.altNames"
                  border
                  :label="$t('fdbs.categories.local.altNames')"
                >
                  <template v-for="lang in Object.keys(data.altNames)" :key="lang" #[`lang.${lang}`]>
                    <div v-for="(item, idx) in data.altNames[lang]" :key="item" class="mb-2">
                      <v-text-field
                        v-model="data.altNames[lang][idx]"
                        density="compact"
                        hide-details="auto"
                        :label="$t('fdbs.categories.local.altNames')"
                        :name="`altNames.${lang}.${idx}`"
                        variant="outlined"
                      />
                    </div>
                  </template>
                </language-selector>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card border class="mb-6" flat>
          <v-toolbar color="grey-lighten-4">
            <v-toolbar-title class="font-weight-medium">
              {{ $t('fdbs.categories.local._') }}
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="data.name"
                  :error-messages="errors.get('name')"
                  hide-details="auto"
                  :label="$t('fdbs.categories.local.name')"
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
                  :label="$t('fdbs.categories.local.tags')"
                  multiple
                  name="tags"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <attribute-list
          v-model="data.main.attributes"
          class="mb-6"
          :disabled="!globalEdit"
          :errors="errors"
        />
        <category-list
          v-model="data.main.parentCategories"
          class="mb-6"
          :disabled="!globalEdit"
          :errors="errors"
          :locale-id="id"
          outlined
        />
        <portion-size-method-list
          v-model="data.portionSizeMethods"
          class="mb-6"
          :errors="errors"
          :locale-id="id"
        />
      </v-form>
      <div class="d-flex gc-2">
        <v-btn color="secondary" variant="outlined" @click="submit">
          <v-icon icon="$save" start />{{ $t(`common.action.save`) }}
        </v-btn>
        <copy-entry-dialog v-bind="{ entryId, localeId: id, type }" />
        <v-spacer />
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
import { useUser } from '@intake24/admin/stores';
import type {
  CategoryLocalEntry,
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
  },

  setup(props) {
    const http = useHttp();
    const { i18n } = useI18n();
    const user = useUser();

    const { entry: localeEntry } = useEntry<LocaleEntry>(props);

    const loading = ref(false);
    const type = 'categories' as const;
    const entry = ref<CategoryLocalEntry | null>(null);
    const globalEdit = computed(() => user.can('locales:food-list'));
    const isEntryLoaded = computed(() => !!entry.value);

    useEntry<LocaleEntry, FoodDatabaseRefs>(props);
    const { clearError, form: { data, errors, put }, nonInputErrors, originalEntry, routeLeave, toForm } = useEntryForm<
      any,
      LocaleEntry
    >(props, {
      data: {
        name: '',
        main: {
          name: '',
          code: '',
          isHidden: false,
          attributes: {
            readyMealOption: null,
            reasonableAmount: null,
            sameAsBeforeOption: null,
            useInRecipes: null,
          },
          parentCategories: [],
        },
        altNames: {},
        tags: [],
        portionSizeMethods: [],
      },
      config: { extractNestedKeys: true },
    });

    const fetchCategoryOrFood = async (id: string, entryId: string) => {
      if (!entryId || entryId === 'no-category')
        return;

      loading.value = true;
      entry.value = null;

      try {
        const { data } = await http.get<CategoryLocalEntry>(`admin/fdbs/${id}/${type}/${entryId}`);

        toForm(data);
        entry.value = data;
      }
      finally {
        loading.value = false;
      }
    };

    const submit = async () => {
      const data = await put<CategoryLocalEntry>(`admin/fdbs/${props.id}/${type}/${props.entryId}`);
      toForm(data);

      const { name, main: { name: englishName = 'record' } = {} } = data;

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
      globalEdit,
      isEntryLoaded,
      submit,
      type,
    };
  },
});
</script>
