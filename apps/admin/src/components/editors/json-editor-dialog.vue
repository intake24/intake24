<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    persistent
    :scrim="false"
    transition="dialog-bottom-transition"
  >
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-list-item link v-bind="props">
          <template #prepend>
            <v-icon icon="fas fa-code" />
          </template>
          <v-list-item-title>
            {{ $t('common.json._') }}
          </v-list-item-title>
        </v-list-item>
      </slot>
    </template>
    <v-card tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('common.json.title') }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="confirm">
            <v-icon icon="$success" start />{{ $t('common.action.ok') }}
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-container fluid>
        <json-editor-vue v-model="content" class="json-editor" :stringified="false" />
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: [Array, Object],
  },
});

const emit = defineEmits(['update:modelValue']);

const JsonEditorVue = defineAsyncComponent(() => import('json-editor-vue'));

const dialog = ref(false);
const content = ref(props.modelValue);

watch(dialog, (val) => {
  if (!val)
    return;

  content.value = props.modelValue;
});

function close() {
  dialog.value = false;
}

function confirm() {
  emit('update:modelValue', content.value);
  close();
}
</script>
