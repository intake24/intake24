<template>
  <entry-layout v-if="entryLoaded" v-bind="{ id, entry }">
    <embedded-data-table
      ref="table"
      :api-url="url"
      :headers
    >
      <template #header-append>
        <v-btn
          color="primary"
          rounded
          :title="$t('fdbs.associatedFoods.add')"
          @click.stop="dialog?.edit()"
        >
          <v-icon icon="$add" start />
          {{ $t('locales.standard-units.add') }}
        </v-btn>
      </template>
      <template #[`item.code`]="{ item }">
        <div class="d-flex align-center ga-2">
          <iconify v-if="item.icon" height="32" :icon="item.icon" width="32" />
          {{ item.code }}
        </div>
      </template>
      <template #[`item.action`]="{ item }">
        <v-btn
          icon
          :title="$t('common.action.edit')"
          @click.stop="dialog?.edit(item)"
        >
          <v-icon icon="$edit" />
        </v-btn>
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
    <standard-unit-dialog
      ref="dialog"
      :locale-id="id"
      :url
      @changed="table?.fetch()"
    />
  </entry-layout>
</template>

<script lang="ts" setup>
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import type { LocaleEntry, StandardUnitAttributes } from '@intake24/common/types/http/admin';

import { Icon as Iconify } from '@iconify/vue';
import { computed, useTemplateRef } from 'vue';

import { EmbeddedDataTable } from '@intake24/admin/components/data-tables';
import { EntryLayout } from '@intake24/admin/components/layouts';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { ConfirmDialog, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores/messages.ts';

import StandardUnitDialog from './standard-unit-dialog.vue';

defineOptions({ name: 'StandardUnits' });

const props = defineProps({
  id: {
    type: String,
    default: 'create',
  },
});

const { i18n: { t } } = useI18n();
const http = useHttp();

const { entry, entryLoaded } = useEntry<LocaleEntry>(props);
useEntryFetch(props);

const dialog = useTemplateRef('dialog');
const table = useTemplateRef('table');
const url = computed(() => `admin/locales/${props.id}/standard-units`);

const headers: DataTableHeader[] = [
  {
    title: t('locales.standard-units.code'),
    sortable: true,
    key: 'code',
  },
  {
    title: t('common.name'),
    sortable: true,
    key: 'name',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];

async function remove({ id, name }: StandardUnitAttributes) {
  await http.delete(`${url.value}/${id}`);
  useMessages().success(t('common.msg.deleted', { name: name ?? id }));
}
</script>
