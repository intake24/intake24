<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.display.smAndDown" max-width="800px"
    persistent
  >
    <v-card>
      <v-toolbar>
        <v-toolbar-title>
          <v-icon icon="$media" start />
          {{ $t(`media.${isEdit ? 'edit' : 'create'}`) }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        </v-toolbar-items>
      </v-toolbar>
      <v-form @keydown="clearError" @submit.prevent="save">
        <v-container fluid>
          <v-row>
            <v-col class="d-flex gc-4 align-center" cols="12">
              <v-switch
                v-model="customId"
                :disabled="isEdit"
                :label="$t('media.id.custom')"
                @change="toggleCustomId"
              />
              <v-text-field
                v-if="customId || isEdit"
                v-model="data.id"
                :disabled="isEdit"
                :error-messages="errors.get('id')"
                :hint="$t('media.id.help')"
                :label="$t('media.id._')"
                name="id"
                prepend-inner-icon="fas fa-id-badge"
              />
            </v-col>
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
                :disabled="isEdit"
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
                v-model="data.disk"
                :disabled="isEdit"
                :error-messages="errors.get('disk')"
                :items="disks"
                :label="$t('media.disks._')"
                name="disk"
                prepend-inner-icon="fas fa-hard-drive"
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
        </v-container>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { CreateMediaRequest, MediaEntry } from '@intake24/common/types/http/admin';

import { computed, shallowRef } from 'vue';

import { SubmitFooter } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { commonMediaCollections, mediaDisks, resourceMediaCollections } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

type UploadForm = CreateMediaRequest & { file: File | null };

defineOptions({
  name: 'AddMediaDialog',
});

const props = defineProps({
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['changed']);

const { i18n: { t } } = useI18n();
const messages = useMessages();

const collections = computed(() => [
  ...commonMediaCollections.map(value => ({ title: t(`media.collections.${value}`), value })),
  ...(resourceMediaCollections[props.resource] ?? []).map(value => ({ title: t(`media.collections.${props.resource}.${value}`), value })),
]);
const disks = computed(() => mediaDisks.map(value => ({ title: t(`media.disks.${value}`), value })));

const dialog = shallowRef(false);
const customId = shallowRef(false);

const { clearError, data, errors, load, post, patch, reset } = useForm<UploadForm>({ data: {
  id: undefined,
  name: '',
  file: null,
  disk: 'public',
  collection: 'default',
} });
const isEdit = computed(() => !!data.value.id);

function toggleCustomId() {
  data.value.id = undefined;
  errors.clear('id');
}

async function save() {
  if (isEdit.value) {
    const { id, name } = await patch<MediaEntry>(`${props.url}/${data.value.id}`);
    messages.success(t('common.msg.updated', { name: name ?? id }));
  }
  else {
    const { id, name } = await post<MediaEntry>(props.url);
    messages.success(t('common.msg.created', { name: name ?? id }));
  }

  dialog.value = false;
  emit('changed');
}

function close() {
  dialog.value = false;
}

function open(item?: MediaEntry) {
  reset();
  dialog.value = true;

  if (item)
    load(item);
}

defineExpose({ open });
</script>

<style lang="scss">
</style>
