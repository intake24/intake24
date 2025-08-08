<template>
  <div>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end>
        fas fa-photo-film
      </v-icon>
      <v-toolbar-title class="font-weight-medium">
        {{ $t('media.title') }}
      </v-toolbar-title>
      <v-spacer />
    </v-toolbar>
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                :label="$t('media.name')"
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
            <v-col cols="12" md="6">
              <v-select
                v-model="data.collection"
                :error-messages="errors.get('collection')"
                :items="collections"
                :label="$t('media.collections._')"
                name="collection"
                prepend-inner-icon="fas fa-folder"
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
          class="rounded ma-2"
          contain
          height="70"
          :src="item.sizes.thumb"
          width="70"
        />
      </template>
      <template #[`item.collection`]="{ item }">
        {{ t(`media.collections.${item.collection}`) }}
      </template>
      <template #[`item.size`]="{ item }">
        {{ `${Math.floor((item.size / 1024) * 100) / 100} KB` }}
      </template>
      <template #[`item.action`]="{ item }">
        <v-btn
          color="secondary"
          icon
          :title="$t('common.action.edit')"
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
import type { MediaModel } from '@intake24/common/types/http/admin';
import { mediaCollections } from '@intake24/common/types/http/admin';
import { modelToResource } from '@intake24/common/util';
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
  mediaModel: {
    type: String as PropType<MediaModel>,
    required: true,
  },
});

const { i18n: { t } } = useI18n();
const http = useHttp();

const resource = computed(() => modelToResource(props.mediaModel));
const api = computed(() => `admin/${resource.value}/${props.resourceId}/media`);
const collections = computed(() => mediaCollections[props.mediaModel].map(collection => ({
  title: t(`media.collections.${collection}`),
  value: collection,
})));

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
    key: 'name',
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

const { clearError, data, errors, post } = useForm<UploadForm>(
  {
    data: { name: '', file: null, collection: 'default' },
    config: { multipart: true },
  },
);

async function submit() {
  try {
    await post(api.value);
    await table.value?.fetch();
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
