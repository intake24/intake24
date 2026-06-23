<template>
  <entry-layout v-if="entryLoaded" v-bind="{ id, entry }">
    <embedded-data-table :api-url="`admin/users/${id}/securables`" v-bind="{ headers }">
      <template #[`item.securableType`]="{ item }">
        {{ $t(`${modelToResource(item.securableType)}._`) }}
      </template>
      <template #[`item.action`]="{ item }">
        {{ $t(`securables.actions.${item.action}`) }}
      </template>
      <template #[`item.actions`]="{ item }">
        <component
          :is="action"
          v-for="action in actions(item.securableType)"
          :key="action"
          v-bind="{ action, item }"
          :to="{ name: `${modelToResource(item.securableType)}-${action}`, params: { id: item.securableId } }"
        />
      </template>
    </embedded-data-table>
  </entry-layout>
</template>

<script lang="ts">
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import type { UserEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { EmbeddedDataTable } from '@intake24/admin/components/data-tables';
import { Edit, Read } from '@intake24/admin/components/data-tables/action-bar';
import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import { useUser } from '@intake24/admin/stores';
import { modelToResource } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

export default defineComponent({
  name: 'UsersSecurables',

  components: { EmbeddedDataTable, Edit, Read },

  mixins: [detailMixin],

  setup(props) {
    const { i18n } = useI18n();
    const user = useUser();

    const headers: DataTableHeader[] = [
      { title: i18n.t('securables.securableType'), sortable: true, key: 'securableType' },
      { title: i18n.t('securables.securableId'), sortable: true, key: 'securableId' },
      { title: i18n.t('securables.actions._'), sortable: true, key: 'action' },
      { title: i18n.t('common.action._'), sortable: false, key: 'actions', align: 'end' },
    ];

    const { entry, entryLoaded } = useEntry<UserEntry>(props);
    useEntryFetch(props);

    function actions(securableType: string) {
      return ['read', 'edit'].filter(action => user.can(`${modelToResource(securableType)}:${action}`));
    }

    return { actions, entry, entryLoaded, headers, modelToResource };
  },
});
</script>

<style lang="scss" scoped></style>
