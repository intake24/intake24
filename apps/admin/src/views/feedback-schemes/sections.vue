<template>
  <v-card flat tile>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end>
        fas fa-bars-staggered
      </v-icon>
      <v-toolbar-title class="font-weight-medium">
        {{ $t('feedback-schemes.sections.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-menu location="left" :persistent="false">
        <template #activator="{ props }">
          <v-btn
            class="ml-3"
            color="primary"
            icon="$add"
            size="small"
            :title=" $t('feedback-schemes.sections.add')"
            v-bind="props"
          />
        </template>
        <v-list>
          <v-list-item v-for="section in availableSections" :key="section.id" link @click="add(section.id)">
            <v-list-item-title>
              {{ section.title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <options-menu>
        <select-resource resource="feedback-schemes" return-object="sections" @update:model-value="load">
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('feedback-schemes.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="items" @update:model-value="update" />
      </options-menu>
    </v-toolbar>
    <v-list class="list-border py-0">
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
        @end="update"
      >
        <v-list-item
          v-for="(section, index) in sections"
          :key="section.id"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title>{{ section.title }}</v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                :title="$t('feedback-schemes.sections.edit')"
                @click.stop="edit(index, items[index])"
              >
                <v-icon color="secondary-lighten-2">
                  $edit
                </v-icon>
              </v-btn>
            </v-list-item-action>
            <v-list-item-action>
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('feedback-schemes.sections.remove')"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.delete', { name: section.title }) }}
              </confirm-dialog>
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
    <v-dialog
      v-if="typeof dialog.item !== 'string'"
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
            {{
              $t(`feedback-schemes.sections.${dialog.index === -1 ? 'add' : 'edit'}`)
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
                  :label="$t('feedback-schemes.custom.header')"
                >
                  <template v-for="lang in Object.keys(dialog.item.title)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="dialog.item.title[lang]"
                      hide-details="auto"
                      :label="$t('feedback-schemes.custom.header')"
                      variant="outlined"
                    />
                  </template>
                </language-selector>
                <language-selector
                  v-model="dialog.item.content"
                  border
                  :label="$t('feedback-schemes.custom.content')"
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
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type {
  FeedbackSection,
  FeedbackStandardSection,
} from '@intake24/common/feedback';

import { computed, defineComponent, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useRoute, useRouter } from 'vue-router';

import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { HtmlEditor, JsonEditor, JsonEditorDialog, useTinymce } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useListWithDialog } from '@intake24/admin/composables';
import {
  feedbackStandardSections,
} from '@intake24/common/feedback';
import { kebabCase, randomString } from '@intake24/common/util';
import { ConfirmDialog, useI18n } from '@intake24/ui';

export default defineComponent({
  name: 'FeedbackSections',

  components: {
    ConfirmDialog,
    HtmlEditor,
    JsonEditor,
    JsonEditorDialog,
    LanguageSelector,
    OptionsMenu,
    SelectResource,
    VueDraggable,
  },

  props: {
    modelValue: {
      type: Array as PropType<FeedbackSection[]>,
      required: true,
    },
  },

  setup(props, ctx) {
    const route = useRoute();
    const router = useRouter();
    useTinymce();
    const { i18n, translate } = useI18n();

    const newCustomSection = () => ({ id: randomString(6), title: { en: null }, content: { en: null } });

    const { dialog, form, items, add: addCustomSection, edit: editCustomSection, load, remove, reset: resetItem, save, update }
      = useListWithDialog<FeedbackSection>(props, ctx, { newItem: newCustomSection });

    const tab = ref('general');

    const add = (section: FeedbackStandardSection | 'custom') => {
      if (section === 'custom') {
        addCustomSection();
        return;
      }

      if (section === 'submissions')
        items.value.unshift(section);
      else
        items.value.push(section);

      update();
    };

    const edit = (index: number, section: FeedbackSection) => {
      if (typeof section !== 'string') {
        editCustomSection(index, section);
        return;
      }

      const { id } = route.params;
      router.push({ name: `feedback-schemes-${kebabCase(section)}`, params: { id } });
    };

    const reset = () => {
      tab.value = 'general';
      resetItem();
    };

    const availableSections = computed(() => {
      const usedSections = props.modelValue.filter(section => typeof section === 'string');
      return ['custom', ...feedbackStandardSections.filter(section => !usedSections.includes(section))].map(id => ({
        id,
        title: i18n.t(`feedback-schemes.${kebabCase(id)}.title`),
      }) as { id: FeedbackStandardSection | 'custom'; title: string });
    });

    const sections = computed(() => items.value.map(section =>
      typeof section == 'string'
        ? { id: section, title: i18n.t(`feedback-schemes.${kebabCase(section)}.title`) }
        : { id: section.id, title: translate(section.title) || i18n.t(`feedback-schemes.custom.title`) }));

    return {
      add,
      availableSections,
      dialog,
      edit,
      form,
      items,
      load,
      remove,
      reset,
      save,
      sections,
      tab,
      update,
    };
  },
});
</script>

<style lang="scss" scoped></style>
