<template>
  <v-expansion-panels v-model="panel" flat>
    <v-expansion-panel>
      <v-expansion-panel-title class="text-h5 font-weight-medium">
        <template #default="{ collapseIcon, expandIcon, expanded }">
          <v-icon
            class="my-auto me-2"
            :icon="expanded ? collapseIcon : expandIcon"
          />
          {{ $t('faqs.items.title') }}
        </template>
        <template #actions>
          <v-btn
            color="primary"
            icon="$add"
            size="x-small"
            :title=" $t('faqs.items.add')"
            @click.stop="add"
          />
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-list class="py-0">
          <vue-draggable
            v-model="items"
            :animation="300"
            class="d-flex flex-column gr-2"
            handle=".drag-and-drop__handle"
            @end="update"
          >
            <v-list-item
              v-for="(item, index) in items"
              :key="item.id"
              class="rounded-lg border"
              :class="itemErrors(index).length ? 'text-error' : undefined"
              link
              :variant="itemErrors(index).length ? 'tonal' : undefined"
            >
              <template #prepend>
                <v-avatar class="drag-and-drop__handle" icon="$handle" />
              </template>
              <v-list-item-title>{{ translate(item.title) }}</v-list-item-title>
              <template #append>
                <list-item-error :errors="itemErrors(index)" />
                <v-list-item-action>
                  <v-btn
                    icon="$edit"
                    :title="$t('faqs.items.edit')"
                    @click.stop="edit(index, items[index])"
                  />
                </v-list-item-action>
                <v-list-item-action>
                  <confirm-dialog
                    color="error"
                    icon
                    icon-left="$delete"
                    :label="$t('faqs.items.remove')"
                    @confirm="remove(index)"
                  >
                    {{ $t('common.action.confirm.delete', { name: translate(item.title) }) }}
                  </confirm-dialog>
                </v-list-item-action>
              </template>
            </v-list-item>
          </vue-draggable>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
  <v-dialog
    v-model="dialog.show"
    fullscreen
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
          {{ $t(`faqs.items.${dialog.index === -1 ? 'add' : 'edit'}`) }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save(dialog.index)">
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
      <v-form ref="form" @submit.prevent="save(dialog.index)">
        <v-container>
          <error-list v-if="dialog.index !== -1" :errors="itemErrors(dialog.index)" />
          <v-tabs-window v-model="tab" class="pt-1">
            <v-tabs-window-item value="general">
              <language-selector
                v-model="dialog.item.title"
                border
                class="mb-4"
                :label="$t('faqs.items.header')"
              >
                <template v-for="lang in Object.keys(dialog.item.title)" :key="lang" #[`lang.${lang}`]>
                  <v-text-field
                    v-model="dialog.item.title[lang]"
                    hide-details="auto"
                    :label="$t('faqs.items.header')"
                    variant="outlined"
                  />
                </template>
              </language-selector>
              <language-selector
                v-model="dialog.item.content"
                border
                :label="$t('faqs.items.content')"
              >
                <template v-for="lang in Object.keys(dialog.item.content)" :key="lang" #[`lang.${lang}`]>
                  <html-editor v-model="dialog.item.content[lang]" />
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
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { HtmlEditor, JsonEditor, useTinymce } from '@intake24/admin/components/editors';
import { ErrorList, LanguageSelector } from '@intake24/admin/components/forms';
import { ListItemError } from '@intake24/admin/components/lists';
import { useListWithDialog } from '@intake24/admin/composables';
import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { FAQItem } from '@intake24/common/types/http/admin';
import { randomString } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { ConfirmDialog } from '@intake24/ui';

defineOptions({ name: 'FAQItems' });

const props = defineProps({
  errors: {
    type: Object as PropType<ReturnUseErrors>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  modelValue: {
    type: Array as PropType<FAQItem[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

useTinymce();
const { translate } = useI18n();

const newItem = () => ({ id: randomString(6), title: { en: '' }, content: { en: '' } });

const { dialog, form, items, add, edit, remove, reset: resetItem, save: saveItem, update }
  = useListWithDialog<FAQItem>(props, { emit }, { newItem });

const panel = ref(0);
const tab = ref('general');

function itemErrors(index: number) {
  return props.errors.get(`content.${props.index}.items.${index}.*`);
}

function reset() {
  tab.value = 'general';
  resetItem();
}

function save(index?: number) {
  props.errors.clear(typeof index === 'undefined' ? `content.${props.index}.items.*` : `content.${props.index}.items.${index}.*`);

  saveItem();
}
</script>

<style lang="scss" scoped></style>
