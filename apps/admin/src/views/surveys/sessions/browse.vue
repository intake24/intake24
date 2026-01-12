<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <embedded-data-table ref="table" :api-url="baseAPI" :headers="headers">
      <template #[`item.createdAt`]="{ item }">
        {{ formatDateTime(item.createdAt) }}
      </template>
      <template #[`item.updatedAt`]="{ item }">
        {{ formatDateTime(item.updatedAt) }}
      </template>
      <template #[`item.action`]="{ item }">
        <v-btn
          color="secondary"
          icon="$read"
          :title="$t('common.action.read')"
          @click.stop="detail(item.id)"
        />
        <confirm-dialog
          color="error"
          icon
          icon-left="$delete"
          :label="$t('common.action.delete')"
          @confirm="remove(item.id)"
        >
          {{ $t('common.action.confirm.delete', { name: item.id }) }}
        </confirm-dialog>
      </template>
    </embedded-data-table>
    <v-dialog v-model="dialog" fullscreen :scrim="false" transition="dialog-bottom-transition">
      <v-card tile>
        <v-toolbar color="secondary">
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
          <v-toolbar-title>
            {{ selected.id }}
          </v-toolbar-title>
        </v-toolbar>
        <v-container fluid>
          <json-editor v-bind="{ readOnly: true, modelValue: selected }" />
        </v-container>
      </v-card>
    </v-dialog>
  </layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { EmbeddedDataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import { JsonEditor } from '@intake24/admin/components/editors';
import { detailMixin } from '@intake24/admin/components/entry';
import { useDateTime, useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { SurveyEntry, UserSurveySessionAttributes } from '@intake24/common/types/http/admin';
import { ConfirmDialog, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

export default defineComponent({
  name: 'SurveySessions',

  components: { ConfirmDialog, EmbeddedDataTable, JsonEditor },

  mixins: [detailMixin],

  setup(props) {
    const { i18n: { t } } = useI18n();
    const { formatDateTime } = useDateTime();

    const { entry, entryLoaded } = useEntry<SurveyEntry>(props);
    useEntryFetch(props);

    const headers: DataTableHeader[] = [
      {
        title: t('surveys.sessions.id'),
        sortable: true,
        key: 'id',
        align: 'start',
      },
      {
        title: t('users.id'),
        sortable: true,
        key: 'userId',
        align: 'start',
      },
      {
        title: t('users.aliases.username'),
        sortable: true,
        key: 'username',
        align: 'start',
      },
      {
        title: t('common.createdAt'),
        sortable: true,
        key: 'createdAt',
        align: 'start',
      },
      {
        title: t('common.updatedAt'),
        sortable: true,
        key: 'updatedAt',
        align: 'start',
      },
      {
        title: t('common.action._'),
        sortable: false,
        key: 'action',
        align: 'end',
      },
    ];

    const table = ref<InstanceType<typeof EmbeddedDataTable>>();

    return {
      entry,
      entryLoaded,
      formatDateTime,
      headers,
      table,
    };
  },

  data() {
    return {
      dialog: false,
      selected: {} as UserSurveySessionAttributes,
    };
  },

  computed: {
    baseAPI(): string {
      return `admin/surveys/${this.id}/sessions`;
    },
    isSelected(): boolean {
      return !Object.keys(this.selected).length;
    },
  },

  methods: {
    open() {
      this.dialog = true;
    },
    close() {
      this.dialog = false;
    },

    async detail(submissionId: string) {
      const { data } = await this.$http.get<UserSurveySessionAttributes>(
        `${this.baseAPI}/${submissionId}`,
      );

      this.selected = data;
      this.open();
    },

    async remove(submissionId: string) {
      await this.$http.delete(`${this.baseAPI}/${submissionId}`);
      useMessages().success(this.$t(`common.msg.deleted`, { name: submissionId }));
      await this.table?.fetch();
    },
  },
});
</script>

<style lang="scss" scoped></style>
