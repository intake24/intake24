<template>
  <div>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end>
        fas fa-shield-halved
      </v-icon>
      <v-toolbar-title class="font-weight-medium">
        {{ $t('media.title') }}
      </v-toolbar-title>
      <v-spacer />
    </v-toolbar>
    <!-- <v-file-upload /> -->
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                :label="$t('media.id')"
                name="name"
                prepend-inner-icon="$media"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-file-input
                v-model="data.file"
                :error-messages="errors.get('file')"
                :label="$t('media.file')"
                name="file"
                prepend-icon=""
                prepend-inner-icon="fas fa-paperclip"
                @change="errors.clear('file')"
              />
            </v-col>
          </v-row>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
    <embedded-data-table v-bind="{ apiUrl: api, headers }" ref="table">
      <template #[`item.thumb`]="{ item }">
        <v-img
          class="rounded"
          contain
          height="100"
          :src="item.sizes.thumb"
          width="100"
        />
      </template>
      <template #[`item.action`]="{ item }">
        <v-btn
          color="secondary"
          icon
          :title="$t('common.action.edit')"
          @click.stop="editUser(item)"
        >
          <v-icon>
            $edit
          </v-icon>
        </v-btn>
        <confirm-dialog
          color="error"
          icon
          icon-left="$delete"
          :label="$t('common.action.delete')"
          @confirm="remove(item.id)"
        >
          {{ $t('common.action.confirm.delete', { name: item.name ? item.name : item.id }) }}
        </confirm-dialog>
      </template>
    </embedded-data-table>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { DataTableHeader } from '../data-tables';
import { computed, useTemplateRef } from 'vue';
import { SubmitFooter } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import type { SecurableType } from '@intake24/common/security';
import { getResourceFromSecurable } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { ConfirmDialog } from '@intake24/ui';
import { EmbeddedDataTable } from '../data-tables';

type UploadForm = {
  name: string | null;
  file: File | null;
  collection: string | null;
};

defineOptions({
  name: 'ResourceMedia',
});

const props = defineProps({
  resourceId: {
    type: String,
    required: true,
  },
  securableType: {
    type: String as PropType<SecurableType>,
    required: true,
  },
});

const { i18n: { t } } = useI18n();
const http = useHttp();

const api = computed(() => `admin/${getResourceFromSecurable(props.securableType)}/${props.resourceId}/media`);

const table = useTemplateRef('table');

const headers: DataTableHeader[] = [
  {
    title: '',
    sortable: true,
    key: 'thumb',
    align: 'start',
  },
  {
    title: t('media.disk'),
    sortable: true,
    key: 'disk',
    align: 'start',
  },
  {
    title: t('media.collection'),
    sortable: true,
    key: 'collection',
    align: 'start',
  },
  {
    title: t('users.name'),
    sortable: true,
    key: 'name',
    align: 'start',
  },
  {
    title: t('common.action._'),
    sortable: false,
    key: 'action',
    align: 'end',
  },
];

const { clearError, data, errors, post } = useForm<UploadForm>(
  {
    data: { name: '', file: null, collection: 'default' },
    config: { multipart: true },
  },
);

async function submit() {
  try {
    await post(api.value);
  }
  catch (error) {
    console.error('Error uploading media:', error);
  }
}

async function remove(id: string) {
  await http.delete(`${api.value}/${id}`);
  await table.value?.fetch();
};
</script>

<style lang="scss" scoped></style>
