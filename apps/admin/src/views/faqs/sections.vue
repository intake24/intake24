<template>
  <v-card flat tile>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end icon="fas fa-bars-staggered" />
      <v-toolbar-title class="font-weight-medium">
        {{ $t('faqs.sections.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        class="ml-3"
        color="primary"
        icon="$add"
        size="small"
        :title=" $t('faqs.sections.add')"
        @click.stop="add"
      />
      <options-menu>
        <select-resource resource="faqs" return-object="content" @update:model-value="load">
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('faqs.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="items" @update:model-value="update" />
      </options-menu>
    </v-toolbar>
    <vue-draggable
      v-model="items"
      :animation="300"
      class="pa-3 d-flex flex-column gr-3"
      handle=".drag-and-drop__handle"
      @end="update"
    >
      <v-card
        v-for="(item, index) in items"
        :key="item.id"
        class="pa-3"
        color="grey-lighten-3"
        flat
        rounded
        tile
      >
        <div class="d-flex align-center">
          <div class="">
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </div>
          <div class="text-h5 font-weight-medium flex-1-1 text-truncate">
            {{ translate(item.title) }}
          </div>
          <div class="">
            <v-btn
              icon="$edit"
              size="small"
              :title="$t('faqs.sections.edit')"
              variant="text"
              @click.stop="edit(index, items[index])"
            />
            <confirm-dialog
              color="error"
              icon
              icon-left="$delete"
              :label="$t('faqs.sections.remove')"
              size="small"
              variant="text"
              @confirm="remove(index)"
            >
              {{ $t('common.action.confirm.delete', { name: translate(item.title) }) }}
            </confirm-dialog>
          </div>
        </div>
        <v-divider class="my-2" />
        <faq-items v-model="item.items" :errors :index />
      </v-card>
    </vue-draggable>
    <v-dialog
      v-model="dialog.show"
      :max-width="800"
      persistent
      :retain-focus="false"
      :scrim="false"
      transition="dialog-bottom-transition"
      :z-index="1050"
    >
      <v-card tile>
        <v-toolbar color="secondary" dark>
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
          <v-toolbar-title>
            <v-icon icon="fas fa-bars-staggered" start />
            {{
              $t(`faqs.sections.${dialog.index === -1 ? 'add' : 'edit'}`)
            }}
          </v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-toolbar-items>
          <template #extension>
            <v-container>
              <v-tabs v-model="tab" bg-color="secondary">
                <v-tab v-for="item in ['general', 'json']" :key="item" :value="item">
                  {{ $t(`common.tabs.${item}`) }}
                </v-tab>
              </v-tabs>
            </v-container>
          </template>
        </v-toolbar>
        <v-form ref="form" @submit.prevent="save">
          <v-container>
            <v-tabs-window v-model="tab" class="pt-1">
              <v-tabs-window-item value="general">
                <language-selector
                  v-model="dialog.item.title"
                  border
                  class="mb-4"
                  :label="$t('faqs.sections.header')"
                >
                  <template v-for="lang in Object.keys(dialog.item.title)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="dialog.item.title[lang]"
                      hide-details="auto"
                      :label="$t('faqs.sections.header')"
                      variant="outlined"
                    />
                  </template>
                </language-selector>
              </v-tabs-window-item>
              <v-tabs-window-item value="json">
                <json-editor v-model="dialog.item" />
              </v-tabs-window-item>
            </v-tabs-window>
            <v-card-actions>
              <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
                <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
              </v-btn>
              <v-spacer />
              <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
                <v-icon icon="$success" start />{{ $t('common.action.ok') }}
              </v-btn>
            </v-card-actions>
          </v-container>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { JsonEditor, JsonEditorDialog, useTinymce } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useListWithDialog } from '@intake24/admin/composables';
import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { FAQSection } from '@intake24/common/types/http/admin';
import { randomString } from '@intake24/common/util';
import { ConfirmDialog, useI18n } from '@intake24/ui';
import FaqItems from './items.vue';

defineOptions({ name: 'FAQSections' });

const props = defineProps({
  errors: {
    type: Object as PropType<ReturnUseErrors>,
    required: true,
  },
  modelValue: {
    type: Array as PropType<FAQSection[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

useTinymce();
const { translate } = useI18n();

const newSection = () => ({ id: randomString(6), title: { en: '' }, items: [] });

const { dialog, form, items, add, edit, load, remove, reset: resetItem, save, update }
  = useListWithDialog<FAQSection>(props, { emit }, { newItem: newSection, watch: true });

const tab = ref('general');

function reset() {
  tab.value = 'general';
  resetItem();
}
</script>

<style lang="scss" scoped></style>
