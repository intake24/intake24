<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="1000px">
    <template #activator="{ props: dProps }">
      <v-btn color="primary" rounded :title="$t('fdbs.search._')" v-bind="dProps">
        <v-icon icon="$search" start /> {{ $t('fdbs.search._') }}
      </v-btn>
    </template>
    <v-card :loading="loading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('fdbs.search.title') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-6">
        <v-text-field
          ref="searchRef"
          v-model="search"
          class="mb-4"
          clearable
          hide-details="auto"
          :label="$t('common.search._')"
          :loading="loading"
          prepend-inner-icon="$search"
          variant="outlined"
          @click:clear="clear"
        />
        <v-data-table
          :headers="headers"
          item-key="_id"
          :items="items"
          :items-per-page="25"
          @click:row="selectItem"
        >
          <template #[`item.resource`]="{ item }">
            <v-icon>{{ `$${item.resource}` }}</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '../data-tables';
import { watchDebounced } from '@vueuse/core';
import { nextTick, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useHttp } from '@intake24/admin/services';
import type {
  CategoriesResponse,
  CategoryListEntry,
  FoodsResponse,
} from '@intake24/common/types/http/admin';

import { useI18n } from '@intake24/i18n';

export type Category = CategoryListEntry & { resource: 'categories' };
export type Food = FoodsResponse['data'][number] & { resource: 'foods' };

export type FoodSearchItem = Category | Food;

defineOptions({ name: 'FoodExplorerSearch' });

const props = defineProps({
  localeId: {
    type: String,
    required: true,
  },
});

const http = useHttp();
const { i18n } = useI18n();
const route = useRoute();
const router = useRouter();

const dialog = ref(false);
const loading = ref(false);
const search = ref('');
const searchRef = useTemplateRef('searchRef');

const categories = ref<CategoriesResponse['data']>([]);
const foods = ref<FoodsResponse['data']>([]);
const items = ref<FoodSearchItem[]>([]);

const headers: DataTableHeader[] = [
  { title: '', key: 'resource', sortable: false },
  { title: i18n.t('fdbs.foods.code'), key: 'code' },
  { title: i18n.t('fdbs.foods.englishName'), key: 'englishName' },
  { title: i18n.t('fdbs.foods.name'), key: 'name' },
];

async function clear() {
  search.value = '';
}

function close() {
  dialog.value = false;
}

async function fetchCategories() {
  const {
    data: { data },
  } = await http.get<CategoriesResponse>(`admin/fdbs/${props.localeId}/categories`, {
    params: { limit: 25, search: search.value },
  });

  categories.value = data;

  return data;
}

async function fetchFoods() {
  const {
    data: { data },
  } = await http.get<FoodsResponse>(`admin/fdbs/${props.localeId}/foods`, {
    params: { limit: 25, search: search.value },
  });

  foods.value = data;

  return data;
}

async function fetchItems() {
  loading.value = true;

  try {
    const [categories, foods] = await Promise.all([fetchCategories(), fetchFoods()]);

    // @ts-expect-error volar issue ?
    items.value = [
      ...categories.map(cat => ({ ...cat, resource: 'categories', _id: `cat:${cat.id}` })),
      ...foods.map(food => ({ ...food, resource: 'foods', _id: `food:${food.id}` })),
    ].sort((a, b) => a.name.localeCompare(b.name));
  }
  finally {
    loading.value = false;
  }
}

async function selectItem(event: PointerEvent, ops: { item: FoodSearchItem }) {
  const { item: { id: entryId, resource } } = ops;
  dialog.value = false;

  const name = `fdbs-${resource}`;

  if (route.name === name && route.params.entryId === entryId)
    return;

  await router.push({
    name: `fdbs-${resource}`,
    params: { id: props.localeId, entryId },
  });
}

watchDebounced(
  search,
  async () => {
    await fetchItems();
  },
  { debounce: 500, maxWait: 2000 },
);

watch(dialog, async (val) => {
  if (!val)
    return;

  await nextTick();
  searchRef.value?.focus();
});
</script>

<style lang="scss">
.v-data-table tr {
  cursor: pointer;
}
</style>
