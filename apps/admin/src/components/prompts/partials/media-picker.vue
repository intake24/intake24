<template>
  <v-card border flat>
    <v-toolbar class="px-2" color="grey-lighten-4">
      <v-icon icon="$media" />
      <v-toolbar-title v-if="title" class="text-title-medium">
        {{ title }}
      </v-toolbar-title>
      <confirm-dialog
        v-if="mediaUrl"
        color="error"
        icon
        icon-left="$delete"
        :label="$t('common.action.remove')"
        variant="text"
        @confirm="deleteFile(mediaUrl)"
      >
        {{ $t('common.action.confirm.remove', { name: mediaId }) }}
      </confirm-dialog>
    </v-toolbar>
    <v-img v-if="mediaUrl" contain :src="mediaUrl" />
    <v-card-text v-else>
      <v-file-upload
        v-model="files"
        accept="image/*"
        append-inner-icon="$desktop"
        clearable
        density="compact"
        :title="$t('media.create')"
        @update:model-value="uploadFile"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import { computed, ref } from 'vue';

import { ConfirmDialog, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

import { useMedia } from '../../media';

const props = defineProps({
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
  title: {
    type: String as PropType<string>,
  },
});

const emit = defineEmits(['update:modelValue']);

const messages = useMessages();
const { i18n: { t } } = useI18n();
const { extractMediaId, getFullURL, getRelativeURL, uploadMedia, deleteMedia } = useMedia();

const mediaUrl = computed(() => props.modelValue ? getFullURL(props.modelValue) : null);
const mediaId = computed(() => props.modelValue ? extractMediaId(props.modelValue) : null);

const files = ref<File[]>([]);

async function uploadFile(files: File[]) {
  const [file] = files;
  try {
    const media = await uploadMedia(file, 'carousel', 'public');
    emit('update:modelValue', getRelativeURL(media.url));
  }
  catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

async function deleteFile(url: string) {
  const mediaId = extractMediaId(url);
  if (mediaId) {
    await deleteMedia(mediaId);
  }

  files.value = [];
  emit('update:modelValue', null);
  messages.success(t('common.msg.deleted', { name: mediaId ?? 'file' }));
}
</script>

<style>
.preview-image__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.25);
}
</style>
