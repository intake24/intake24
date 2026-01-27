<template>
  <editor
    v-bind="{
      init,
      licenseKey: 'gpl',
      modelValue,
    }"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script lang="ts" setup>
import type { EditorOptions } from 'tinymce/tinymce';
import type { PropType } from 'vue';

import Editor from '@tinymce/tinymce-vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLocale } from 'vuetify';

import { useHttp } from '@intake24/admin/services';
import { useResource } from '@intake24/admin/stores';

import 'tinymce/tinymce';
import 'tinymce/icons/default/icons.min.js';
import 'tinymce/themes/silver/theme.min.js';
import 'tinymce/models/dom/model.min.js';
import 'tinymce/skins/ui/oxide/skin.js';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/table';
import 'tinymce/skins/content/default/content.js';
import 'tinymce/skins/ui/oxide/content.js';

const props = defineProps({
  initProps: {
    type: Object as PropType<Partial<EditorOptions>>,
  },
  modelValue: {
    type: String as PropType<string | null>,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const http = useHttp();
const vLocale = useLocale();
const route = useRoute();
const resource = useResource();

const mediaUploadUrl = computed(() => `admin/${resource.name}${route.params.id ? `/${route.params.id}` : ''}/media`);

const init = computed<Partial<EditorOptions>>(() => ({
  license_key: 'gpl',
  skin_url: 'default',
  directionality: vLocale.isRtl.value ? 'rtl' : 'ltr',
  default_link_target: '_blank',
  min_height: 450,
  menubar: false,
  paste_as_text: true,
  paste_data_images: true,
  images_upload_handler: async (blobInfo) => {
    const formData = new FormData();
    formData.append('file', new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type }));
    formData.append('collection', 'tinymce');
    formData.append('disk', 'public');

    return new Promise((resolve, reject) => {
      http.post(mediaUploadUrl.value, formData)
        .then((response) => {
          resolve(response.data.sizes.md);
        })
        .catch((error) => {
          console.error('Image upload error:', error);
          reject(error);
        });
    });
  },
  plugins: [
    'advlist',
    'autolink',
    'code',
    'fullscreen',
    'image',
    'link',
    'lists',
    'media',
    'preview',
    'table',
  ],
  toolbar:
          'undo redo | formatselect | bold italic strikethrough | forecolor backcolor | hr | link image media | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | preview fullscreen code',
  ...(props.initProps ?? {}),
}));
</script>
