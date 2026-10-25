<template>
  <simple-layout>
    <div class="d-flex flex-row align-center justify-space-between">
      <div class="text-headline-medium font-bold">
        {{ $t('audit.tables.title') }}
      </div>
      <v-btn
        color="primary"
        rounded
        @click="save"
      >
        <v-icon icon="$save" start />
        {{ $t('common.action.save') }}
      </v-btn>
    </div>
    <p class="text-gray-600">
      {{ $t('audit.tables.subtitle') }}
    </p>
    <v-tabs v-model="tab" class="mt-4">
      <v-tab v-for="db in databaseTypes" :key="db" :value="db">
        {{ db }}
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab" class="pt-1">
      <v-tabs-window-item v-for="db in databaseTypes" :key="db" :value="db">
        <v-row>
          <v-col cols="12" md="6">
            <v-list-subheader>
              {{ $t('audit.tables.selected') }}
            </v-list-subheader>
            <v-list v-model="data[tab]" class="list-border">
              <v-list-item v-for="(table, idx) in data[tab]" :key="table.id" prepend-icon="fas fa-table" :value="table">
                <v-list-item-title>{{ table.id }}</v-list-item-title>
                <template #append>
                  <v-list-item-action>
                    <v-btn
                      icon="$options"
                      @click.stop="selectTable(tab, idx)"
                    />
                  </v-list-item-action>
                  <v-list-item-action>
                    <v-btn
                      color="error"
                      icon="$delete"
                      @click.stop="remove(tab, idx)"
                    />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="6">
            <v-list-subheader>
              {{ $t('audit.tables.available') }}
            </v-list-subheader>
            <v-list v-model="availableTables[tab]" class="list-border">
              <v-list-item v-for="table in availableTables[tab]" :key="table" link prepend-icon="fas fa-table" :value="table">
                <v-list-item-title>{{ table }}</v-list-item-title>
                <template #append>
                  <v-list-item-action>
                    <v-btn
                      icon="$add"
                      @click.stop="add(tab, table)"
                    />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
    <v-dialog max-width="600px" :model-value="!!selectedTable">
      <v-card v-if="selectedTable" class="pa-2">
        <custom-list
          v-model="selectedTable.exclude"
          flat
          :item="$t('audit.tables.exclude')"
          name="exclude"
        />
        <v-card-actions>
          <v-spacer />
          <v-btn color="info" variant="text" @click="confirmTable">
            {{ $t('common.action.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </simple-layout>
</template>

<script lang="ts" setup>
import type { DatabaseType } from '@intake24/common/types';
import type { AuditTableAttributes, AuditTablesRequest } from '@intake24/common/types/http/admin';

import { computed, onMounted, shallowRef } from 'vue';

import { SimpleLayout } from '@intake24/admin/components/layouts';
import { CustomList } from '@intake24/admin/components/lists';
import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { databaseTypes } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

defineOptions({
  name: 'AuditTables',
});

const { i18n: { t } } = useI18n();
const http = useHttp();

const tab = shallowRef<DatabaseType>('foods');

const { data, post } = useForm<AuditTablesRequest>({ data: { foods: [], system: [] } });
const refs = shallowRef<Record<DatabaseType, string[]>>({ foods: [], system: [] });
const availableTables = computed(() => ({
  foods: refs.value.foods.filter(table => !data.value.foods.some(t => t.id === table)).toSorted(),
  system: refs.value.system.filter(table => !data.value.system.some(t => t.id === table)).toSorted(),
}));

const selectedTable = shallowRef<AuditTableAttributes | undefined>(undefined);
function selectTable(db: DatabaseType, idx: number) {
  selectedTable.value = data.value[db][idx];
}
function confirmTable() {
  selectedTable.value = undefined;
}

async function fetchData() {
  const [dataRes, refRes] = await Promise.all([
    http.get<AuditTablesRequest>('admin/audit/tables'),
    http.get<Record<DatabaseType, string[]>>('admin/references/audit'),
  ]);
  refs.value = refRes.data;
  data.value = dataRes.data;
}

function add(db: DatabaseType, table: string) {
  data.value[db].push({ id: table, exclude: [] });
  data.value[db].sort((a, b) => a.id.localeCompare(b.id));
}

function remove(db: DatabaseType, idx: number) {
  data.value[db].splice(idx, 1);
}

async function save() {
  const res = await post<AuditTablesRequest>(`admin/audit/tables`);
  data.value = res;

  useMessages().success(t('common.msg.updated', { name: t('audit.tables.title') }));
}
onMounted(async () => {
  await fetchData();
});
</script>
