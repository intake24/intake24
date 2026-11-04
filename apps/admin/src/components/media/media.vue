<template>
  <v-toolbar color="surface">
    <v-icon end icon="$media" />
    <v-toolbar-title class="font-weight-medium">
      {{ $t('media.title') }}
    </v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <embedded-data-table v-bind="{ apiUrl: url, headers }" ref="table">
    <template #header-append>
      <v-btn
        color="primary"
        rounded
        @click.stop="dialog?.open()"
      >
        <v-icon icon="$add" start />
        {{ $t('media.create') }}
      </v-btn>
    </template>
    <template #[`item.thumb`]="{ item }">
      <v-img
        class="rounded ma-2"
        contain
        height="70"
        :src="item.sizes.sm"
        width="70"
      />
    </template>
    <template #[`item.collection`]="{ item }">
      {{ getMediaCollectionTitle(item.collection) }}
    </template>
    <template #[`item.size`]="{ item }">
      {{ `${Math.floor((item.size / 1024) * 100) / 100} KB` }}
    </template>
    <template #[`item.action`]="{ item }">
      <v-btn
        icon="$edit"
        :title="$t('common.action.edit')"
        @click="dialog?.open(item)"
      />
      <confirm-dialog
        color="error"
        icon
        icon-left="$delete"
        :label="$t('common.action.delete')"
        @confirm="remove(item)"
      >
        {{ $t('common.action.confirm.delete', { name: item.name ? item.name : item.id }) }}
      </confirm-dialog>
    </template>
  </embedded-data-table>
  <media-dialog
    ref="dialog"
    v-bind="{ resource, resourceId, url }"
    @changed="table?.fetch()"
  />
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '../data-tables';
import type { MediaEntry } from '@intake24/common/types/http/admin/media.ts';

import { storeToRefs } from 'pinia';
import { computed, useTemplateRef } from 'vue';

import { useHttp } from '@intake24/admin/services';
import { useResource } from '@intake24/admin/stores/resource.ts';
import { commonMediaCollections } from '@intake24/common/types/http/admin/media.ts';
import { ConfirmDialog, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores/messages.ts';

import { EmbeddedDataTable } from '../data-tables';
import MediaDialog from './media-dialog.vue';

defineOptions({
  name: 'ResourceMedia',
});

const props = defineProps({
  resourceId: {
    type: String,
    required: true,
  },
});

const { i18n: { t } } = useI18n();
const http = useHttp();
const messages = useMessages();
const { name: resource } = storeToRefs(useResource());

const url = computed(() => `admin/${resource.value}/${props.resourceId}/media`);

const dialog = useTemplateRef('dialog');
const table = useTemplateRef('table');

const headers: DataTableHeader[] = [
  {
    title: '',
    sortable: true,
    key: 'thumb',
    align: 'start',
  },
  {
    title: t('media.name'),
    sortable: true,
    key: 'name',
    align: 'start',
  },
  {
    title: t('media.filename'),
    sortable: true,
    key: 'filename',
    align: 'start',
  },
  {
    title: t('media.collections._'),
    sortable: true,
    key: 'collection',
    align: 'start',
  },
  {
    title: t('media.size'),
    sortable: true,
    key: 'size',
    align: 'start',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];

function getMediaCollectionTitle(collection: string) {
  return commonMediaCollections.includes(collection) ? t(`media.collections.${collection}`) : t(`media.collections.${resource.value}.${collection}`);
}

async function remove({ id, name }: MediaEntry) {
  await http.delete(`${url.value}/${id}`);
  await table.value?.fetch();
  messages.success(t('common.msg.deleted', { name: name ?? id }));
};
</script>

<style lang="scss" scoped></style>
