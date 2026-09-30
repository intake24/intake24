<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.mobile || fullscreen" max-width="800px" min-height="400px">
    <template #activator="{ props }">
      <v-list-item v-bind="props" prepend-icon="fas fa-timeline" :title="$t('common.audit._')" />
    </template>
    <v-card :tile="$vuetify.display.mobile">
      <v-toolbar>
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('common.audit.title') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          v-if="!$vuetify.display.mobile"
          :icon="fullscreen ? 'fas fa-minimize' : 'fas fa-maximize'"
          title="Fullscreen"
          variant="plain"
          @click="toggleFullscreen"
        />
        <template #extension>
          <div class="d-flex align-center w-100 justify-space-between">
            <v-tabs v-model="tab">
              <v-tab v-for="tab in tabs" :key="tab" :value="tab">
                {{ tab }}
              </v-tab>
            </v-tabs>
            <v-btn-toggle v-model="view" mandatory>
              <v-btn :title="$t('common.audit.view.table')" value="table">
                <v-icon icon="fas fa-table" />
              </v-btn>
              <v-btn :title="$t('common.audit.view.json')" value="json">
                <v-icon icon="fas fa-code" />
              </v-btn>
            </v-btn-toggle>
          </div>
        </template>
      </v-toolbar>
      <v-container fluid>
        <v-tabs-window v-model="tab" class="pt-1">
          <v-tabs-window-item v-for="tab in tabs" :key="tab" :value="tab">
            <v-data-table
              v-show="view === 'table'"
              class="elevation-1"
              full-width
              :headers="headers"
              item-value="id"
              :items="history[tab]"
            >
              <template #item.oldValue="{ item }">
                <pre class="text-xs">{{ JSON.stringify(item.oldValue, null, 2) }}</pre>
              </template>
              <template #item.newValue="{ item }">
                <pre class="text-xs">{{ JSON.stringify(item.newValue, null, 2) }}</pre>
              </template>
            </v-data-table>
            <json-editor
              v-show="view === 'json'"
              v-model="history"
              class="flex-1"
              read-only
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { DataTableHeader } from 'vuetify';

import type { DatabaseType } from '@intake24/common/types';
import type { AuditEntry, AuditHistory } from '@intake24/common/types/http/admin';

import { computed, ref, shallowRef, watch } from 'vue';

import { JsonEditor } from '@intake24/admin/components/editors';
import { useHttp } from '@intake24/admin/services';
import { formatDate } from '@intake24/admin/util';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'AuditDialog' });

const props = defineProps({
  resource: {
    type: String as PropType<string>,
    required: true,
  },
  resourceId: {
    type: String as PropType<string>,
    required: true,
  },
  subResource: {
    type: String as PropType<string>,
    required: false,
  },
  subResourceId: {
    type: String as PropType<string>,
    required: false,
  },
});

const http = useHttp();
const { i18n } = useI18n();

const url = computed(() => {
  const { resource, resourceId, subResource, subResourceId } = props;
  return ['admin', 'audit', resource, resourceId, subResource, subResourceId]
    .filter(Boolean)
    .join('/');
});

const dialog = shallowRef(false);
const fullscreen = shallowRef(false);
const history = ref<AuditHistory>({});
const tabs = computed(() => Object.keys(history.value) as DatabaseType[]);
const tab = shallowRef(Object.keys(history.value).at(0));
const view = shallowRef<'table' | 'json'>('table');

const headers: DataTableHeader<AuditEntry>[] = [
  { title: i18n.t('common.audit.table.id'), key: 'id' },
  { title: i18n.t('common.audit.table.tableName'), key: 'tableName' },
  { title: i18n.t('common.audit.table.recordId'), key: 'recordId' },
  { title: i18n.t('common.audit.table.operation'), key: 'operation' },
  {
    title: i18n.t('common.audit.table.changedAt'),
    key: 'changedAt',
    value: item => formatDate(item.changedAt),
  },
  {
    title: i18n.t('common.audit.table.user'),
    key: 'user',
    value: item => item.user?.name ?? item.user?.id,
  },
  { title: i18n.t('common.audit.table.oldValue'), key: 'oldValue' },
  { title: i18n.t('common.audit.table.newValue'), key: 'newValue' },
];

function close() {
  dialog.value = false;
}

async function fetch() {
  const { data } = await http.get(url.value);
  history.value = data;
  tab.value = Object.keys(history.value).at(0);
};

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value;
}

watch(dialog, async (val) => {
  if (val)
    await fetch();
});
</script>

<style lang="scss" scoped></style>
