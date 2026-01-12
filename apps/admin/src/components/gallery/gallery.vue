<template>
  <tool-bar
    :actions="actions.includes('create') ? ['create'] : []"
    :api="api"
    :selected="tracked"
    @refresh="refresh"
  />
  <v-card :border="!$vuetify.display.mobile" :flat="$vuetify.display.mobile" :tile="$vuetify.display.mobile">
    <v-card-text>
      <data-table-filter
        :count="meta.total"
        @filter-reset="resetFilter"
        @filter-set="setFilter"
      />
    </v-card-text>
  </v-card>
  <div v-show="meta.total" class="py-4 text-center">
    <v-pagination v-model="page" :length="meta.lastPage" rounded />
  </div>
  <v-container class="px-0">
    <v-row>
      <v-col v-for="item in items" :key="item.id" cols="12" lg="3" md="4" sm="6">
        <v-card :border="!$vuetify.display.mobile" :flat="$vuetify.display.mobile" height="100%" :tile="$vuetify.display.mobile">
          <router-link :to="{ name: `${module}-read`, params: { id: item.id } }">
            <v-img :src="get(item, imageUrl)" />
          </router-link>
          <v-card-title>
            <slot name="title">
              {{ item[title] }}
            </slot>
          </v-card-title>
          <v-card-subtitle>
            <slot name="subtitle">
              {{ item[subtitle] }}
            </slot>
          </v-card-subtitle>

          <v-divider class="mx-4" />
          <v-card-actions>
            <v-btn
              v-if="can({ action: 'edit' })"
              class="font-weight-bold"
              color="info"
              :to="{ name: `${module}-edit`, params: { id: item.id } }"
              variant="text"
            >
              <v-icon icon="$edit" start />{{ $t(`common.action.edit`) }}
            </v-btn>
            <v-spacer />
            <confirm-dialog
              v-if="can({ action: 'delete' })"
              color="error"
              icon
              icon-left="$delete"
              :label="$t('common.action.delete')"
              variant="text"
              @confirm="remove(item)"
            >
              {{ $t('common.action.confirm.delete', { name: item.id }) }}
            </confirm-dialog>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <div v-show="meta.total" class="py-4 text-center">
      <v-pagination v-model="page" :length="meta.lastPage" rounded />
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { get } from 'lodash-es';
import { computed, onMounted, ref, watch } from 'vue';
import { DataTableFilter } from '@intake24/admin/components/data-tables';
import ToolBar from '@intake24/admin/components/toolbar/tool-bar.vue';
import { useHttp } from '@intake24/admin/services';
import { useMessages, useResource } from '@intake24/admin/stores';
import type { Dictionary } from '@intake24/common/types';
import type { Pagination, PaginationMeta } from '@intake24/common/types/http';
import { ConfirmDialog, useI18n } from '@intake24/ui';

const props = defineProps({
  actions: {
    type: Array as PropType<string[]>,
    default: () => ['create'],
  },
  apiUrl: {
    type: String,
  },
  title: {
    type: String,
    default: 'title',
  },
  subtitle: {
    type: String,
    default: 'subtitle',
  },
  imageUrl: {
    type: String,
    default: 'imageUrl',
  },
  trackBy: {
    type: String,
    default: 'id',
  },
});

const defaultPaginationMeta: PaginationMeta = {
  from: 1,
  lastPage: 1,
  limit: 50,
  page: 1,
  path: '',
  to: 1,
  total: 0,
};

const { i18n: { t } } = useI18n();
const http = useHttp();
const resource = useResource();
const api = computed(() => props.apiUrl ?? resource.api);
const filter = computed(() => resource.getFilter);

const items = ref<Dictionary[]>([]);
const meta = ref<PaginationMeta>({ ...defaultPaginationMeta });
const page = ref(1);
const limit = ref(50);
const selected = ref<Dictionary[]>([]);

const tracked = computed(() => selected.value.map(item => item[props.trackBy]));

async function fetch() {
  const { data } = await http.get<Pagination>(api.value, {
    params: { limit: limit.value, page: page.value, ...filter.value },
    withLoading: true,
  });
  items.value = data.data;
  meta.value = { ...data.meta };
};

async function refresh() {
  await fetch();
};

async function setFilter(data: Dictionary) {
  await resource.setFilter(data);
  await fetch();
};

async function resetFilter() {
  await resource.resetFilter();
  await fetch();
};

async function remove(item: Dictionary): Promise<void> {
  const { id, name } = item;

  await http.delete(`${api.value}/${id}`);
  useMessages().success(t('common.msg.deleted', { name: name ?? id }));
  refresh();
};

onMounted(async () => {
  await fetch();
});

watch(page, async (val, oldVal) => {
  if (val !== oldVal)
    await fetch();
});

watch(api, async () => {
  items.value = [];
  meta.value = { ...defaultPaginationMeta };
});
</script>

<style lang="scss" scoped></style>
