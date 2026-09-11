<template>
  <div>
    <div v-if="isEntryLoaded">
      <div class="d-flex align-center justify-space-between">
        <span class="text-title-medium">
          {{ entry?.name ?? entry?.englishName ?? entry?.code }}
        </span>
        <div class="d-flex align-center gc-1">
          <v-menu
            :close-on-content-click="true"
            location="bottom end"
            :persistent="false"
          >
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="$options" size="small" :title="$t('common.options._')" />
            </template>
            <v-list>
              <copy-entry-dialog
                v-if="!readonly"
                v-bind="{ entryId, localeId: id, type }"
              />
              <audit-dialog
                v-bind="{
                  resource: 'locales',
                  resourceId: id,
                  subResource: type,
                  subResourceId: entryId,
                }"
              />
              <confirm-dialog
                v-if="!readonly"
                color="error"
                icon-left="$delete"
                :label="$t('common.action.delete')"
                @confirm="remove"
              >
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    base-color="error"
                    prepend-icon="$delete"
                    :title="$t('common.action.delete')"
                  />
                </template>
                {{ $t('common.action.confirm.delete', { name: entry?.name }) }}
              </confirm-dialog>
            </v-list>
          </v-menu>
          <v-btn
            v-if="!readonly"
            color="primary"
            rounded="pill"
            :title="$t(`common.action.save`)"
            @click="submit"
          >
            <v-icon icon="$save" start />{{ $t(`common.action.save`) }}
          </v-btn>
        </div>
      </div>
      <v-divider class="my-2" />
      <v-form
        class="pa-2"
        :readonly
        :style="listItemStyle"
        @keydown="clearError"
        @submit.prevent="submit"
      >
        <div class="d-flex flex-column gr-4">
          <v-text-field
            v-model="data.code"
            :error-messages="errors.get('code')"
            :label="$t('fdbs.categories.code')"
            name="code"
          />
          <v-text-field
            v-model="data.englishName"
            :error-messages="errors.get('englishName')"
            :label="$t('fdbs.categories.englishName')"
            name="englishName"
          />
          <v-text-field
            v-model="data.name"
            :error-messages="errors.get('name')"
            :label="$t('fdbs.categories.name')"
            name="name"
          />
          <select-icon
            v-model="data.icon"
            clearable
            :error-messages="errors.get('icon')"
            @update:model-value="errors.clear('icon')"
          />
          <v-switch
            v-model="data.hidden"
            :error-messages="errors.get('hidden')"
            :label="$t('fdbs.categories.hidden')"
            name="hidden"
            @update:model-value="errors.clear('hidden')"
          />
          <custom-list
            v-model="data.tags"
            border
            :error-messages="errors.get('tags')"
            flat
            :item="$t('fdbs.tags._')"
            name="tags"
          />
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
          <portion-size-method-list
            v-model="data.portionSizeMethods"
            :errors
            :locale-id="id"
            :readonly
          />
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

<script lang="ts" setup>
import type { PropType } from 'vue';

import type {
  CategoryEntry,
  CategoryInput,
  FoodDatabaseRefs,
  LocaleEntry,
} from '@intake24/common/types/http/admin';

import { computed, onMounted, ref } from 'vue';
import { onBeforeRouteUpdate, useRouter } from 'vue-router';

import { AuditDialog, ConfirmLeaveDialog } from '@intake24/admin/components/dialogs';
import {
  AttributeList,
  CategoryList,
  CopyEntryDialog,
  PortionSizeMethodList,
} from '@intake24/admin/components/fdbs';
import { CustomList } from '@intake24/admin/components/lists';
import { useEntry, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { ConfirmDialog, SelectIcon, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

import { useOffset } from './use-offset';

defineOptions({ name: 'CategoryEntry' });

const props = defineProps({
  id: {
    type: String as PropType<string>,
    required: true,
  },
  code: {
    type: String as PropType<string>,
    required: true,
  },
  entryId: {
    type: String as PropType<string>,
    required: true,
  },
  readonly: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
});

const http = useHttp();
const router = useRouter();
const { i18n } = useI18n();

const loading = ref(false);
const type = 'categories' as const;
const entry = ref<CategoryEntry | null>(null);
const isEntryLoaded = computed(() => !!entry.value);

useEntry<LocaleEntry, FoodDatabaseRefs>(props);
const { clearError, form: { data, errors, put }, routeLeave, toForm } = useEntryForm<
  Required<CategoryInput>,
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
    parentCategories: [],
    portionSizeMethods: [],
    tags: [],
    icon: null,
    version: '',
  },
  config: { extractNestedKeys: true },
});

const { listItemStyle } = useOffset();

async function fetchCategoryOrFood(id: string, entryId: string) {
  if (!entryId || entryId === 'no-category')
    return;

  loading.value = true;
  entry.value = null;

  try {
    const { data } = await http.get<CategoryEntry>(`admin/fdbs/${props.id}/${type}/${entryId}`);

    toForm(data);
    entry.value = data;
  }
  finally {
    loading.value = false;
  }
}

async function submit() {
  const data = await put<CategoryEntry>(
    `admin/fdbs/${props.id}/${type}/${props.entryId}`,
  );
  toForm(data);

  const { name, englishName } = data;

  useMessages().success(i18n.t('common.msg.updated', { name: name ?? englishName }));
}

async function remove() {
  await http.delete(`admin/fdbs/${props.id}/${type}/${props.entryId}`);

  useMessages().success(i18n.t('common.msg.deleted', { name: entry.value?.name }));

  const parentEntryId = entry.value?.parentCategories?.at(0)?.id;
  if (parentEntryId) {
    await router.push({ name: `fdbs-categories`, params: { id: props.id, entryId: parentEntryId } });
  }
  else {
    await router.push({ name: 'fdbs-food-list', params: { id: props.id } });
  }
}

onMounted(async () => {
  await fetchCategoryOrFood(props.id, props.entryId);
});

onBeforeRouteUpdate(async (to, from) => {
  if (to.params.entryId !== from.params.entryId)
    await fetchCategoryOrFood(to.params.id.toString(), to.params.entryId.toString());
});
</script>
