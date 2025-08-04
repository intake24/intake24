<template>
  <editor
    v-bind="{
      init,
      licenseKey: 'gpl',
      modelValue,
    }"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script lang="ts">
import type { EditorOptions } from 'tinymce/tinymce';
import type { PropType } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { computed, defineComponent } from 'vue';
import { useLocale } from 'vuetify';
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

export default defineComponent({
  name: 'HtmlEditor',

  components: { Editor },

  props: {
    initProps: {
      type: Object as PropType<Partial<EditorOptions>>,
    },
    modelValue: {
      type: String as PropType<string | null>,
      default: '',
    },
  },

  emits: ['update:modelValue'],

  setup(props) {
    const vLocale = useLocale();

    const init = computed<Partial<EditorOptions>>(() => ({
      skin_url: 'default',
      directionality: vLocale.isRtl.value ? 'rtl' : 'ltr',
      default_link_target: '_blank',
      min_height: 450,
      menubar: false,
      paste_as_text: true,
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

    return { init };
  },
});
</script>
