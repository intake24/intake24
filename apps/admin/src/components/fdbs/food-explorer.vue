<template>
  <div>
    <div class="d-flex flex-row justify-space-between">
      <div class="d-flex ga-2">
        <food-search v-bind="{ id, code }" />
        <add-food-dialog v-if="!readonly" v-bind="{ id, code }" />
      </div>
      <v-menu :close-on-content-click="false" location="bottom left">
        <template #activator="{ props }">
          <v-btn color="primary" icon="$options" size="small" v-bind="props" />
        </template>
        <v-list>
          <v-list-item>
            <template #prepend>
              <v-list-item-action>
                <v-switch v-model="showGlobalName" />
              </v-list-item-action>
            </template>
            <v-list-item-title>{{ $t('fdbs.showGlobalName') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-divider class="my-3" />
    <v-treeview
      v-model:activated="activated"
      v-model:opened="opened"
      activatable
      color="primary"
      density="compact"
      item-title="name"
      item-value="key"
      :items="items"
      :load-children="fetchCategoryContent"
      transition
    >
      <template #prepend="{ item }">
        <v-icon v-if="item.type === 'foods'" icon="$foods" start />
      </template>
      <template #title="{ item }">
        <a @click="openItem(item)">{{ item[itemText] }}</a>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts" setup>
import type {
  CategoryContentsResponse,
  CategoryListEntry,
  FoodListEntry,
  RootCategoriesResponse,
} from '@intake24/common/types/http/admin';

import { computed, onMounted, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';

import { useHttp } from '@intake24/admin/services';
import { randomString } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

import AddFoodDialog from './add-food-dialog.vue';
import FoodSearch from './food-search.vue';

export type TreeItem = ((CategoryListEntry & { children: TreeItem[] }) | FoodListEntry) & {
  key: string;
  type: string;
};

defineOptions({ name: 'FoodExplorer' });

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const route = useRoute();
const http = useHttp();
const { i18n } = useI18n();

const activated = ref<string[]>([]);
const opened = ref<string[]>([]);
const items = ref<TreeItem[]>([]);
const showGlobalName = ref<boolean>(false);
const activatedEntryId = ref<string | null>(null);
const activatedEntryCategories = ref<string[]>([]);

const itemText = computed(() => (showGlobalName.value ? 'englishName' : 'name'));

async function fetchRootCategories() {
  const { data } = await http.get<RootCategoriesResponse>(
    `admin/fdbs/${props.id}/categories/root`,
  );

  const noCategory: TreeItem = {
    key: randomString(8),
    type: 'categories',
    id: 'no-category',
    code: 'no-category',
    localeId: props.id,
    name: i18n.t('fdbs.categories.noCategory'),
    englishName: i18n.t('fdbs.categories.noCategory'),
    hidden: false,
    children: [],
  };

  items.value = [
    noCategory,
    ...data.map(category => ({
      ...category,
      key: randomString(8),
      type: 'categories',
      children: [],
    })),
  ];
}

async function fetchCategoryContent(category: TreeItem) {
  const {
    data: { categories, foods },
  } = await http.get<CategoryContentsResponse>(
    `admin/fdbs/${props.id}/categories/${category.id}/contents`,
  );

  if (!('children' in category))
    return;

  category.children.push(
    ...categories.map(item => ({
      ...item,
      key: randomString(8),
      type: 'categories',
      children: [],
    })),
    ...foods.map(item => ({
      ...item,
      key: randomString(8),
      type: 'foods',
    })),
  );
}

async function openItem(item: TreeItem) {
  if (activatedEntryId.value === item.id)
    return;

  activatedEntryId.value = item.id;
  activatedEntryCategories.value = [];

  await router.push({
    name: `fdbs-${item.type}`,
    params: { id: props.id, entryId: item.id },
  });
}

async function findActiveInChildren(children: TreeItem[]) {
  if (!children.length)
    return;

  for (const child of children) {
    if (activatedEntryId.value === child.id) {
      activated.value = [child.key];
      return true;
    }

    if (activatedEntryCategories.value.includes(child.id)) {
      await fetchCategoryContent(child);
      opened.value.push(child.key);

      if (!('children' in child) || !child.children.length)
        continue;

      const found = await findActiveInChildren(child.children);
      if (found)
        return true;
    }
  }
}

async function findActiveInTree(entryId: string, type: string) {
  if (!['categories', 'foods'].includes(type))
    return;

  const { data } = await http.get<{ categories: string[] }>(
    `admin/fdbs/${props.id}/${type}/${entryId}/categories`,
  );

  activatedEntryId.value = entryId;
  activatedEntryCategories.value = data.categories.reverse();

  await findActiveInChildren(items.value);
}

onBeforeRouteUpdate((to, from, next) => {
  if (to.params.entryId !== activatedEntryId.value)
    findActiveInTree(to.params.entryId?.toString(), to.meta.module.current);

  next();
});

onMounted(async () => {
  await fetchRootCategories();
  await findActiveInTree(route.params.entryId?.toString(), route.meta.module.current);
});
</script>
