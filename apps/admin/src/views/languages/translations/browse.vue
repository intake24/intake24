<template>
  <layout v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="save">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('languages.translations.title') }}
      </v-toolbar-title>
      <v-spacer />
      <template v-if="data.translations.length">
        <confirm-dialog
          color="primary"
          icon
          icon-left="fas fa-rotate"
          :label="$t('common.action.sync')"
          size="small"
          @confirm="sync"
        >
          {{ $t('languages.translations.sync') }}
        </confirm-dialog>
        <confirm-dialog
          :activator-class="['ms-2']"
          color="error"
          icon
          icon-left="$delete"
          :label="$t('common.action.delete')"
          size="small"
          @confirm="remove"
        >
          {{ $t('languages.translations.delete') }}
        </confirm-dialog>
      </template>
    </v-toolbar>
    <error-list :errors="nonInputErrors" tag="v-card-text" />
    <v-list v-if="data.translations.length" class="list-border" lines="two">
      <v-list-item
        v-for="translation in data.translations"
        :key="translation.id"
        link
      >
        <template #prepend>
          <v-icon>fas fa-language</v-icon>
        </template>
        <v-list-item-title>
          {{ $t(`languages.translations.applications.${translation.application}`) }} |
          {{ getSectionTitle(translation.section) }}
        </v-list-item-title>
        <template #append>
          <v-list-item-action>
            <v-btn icon="$edit" :title="$t('languages.translations.edit')" @click.stop="edit(translation)" />
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
    <v-card v-else flat link min-height="100px" @click="create">
      <v-card-title class="d-flex justify-center font-weight-medium">
        {{ $t('languages.translations.create') }}
      </v-card-title>
      <v-card-text class="d-flex justify-center align-center">
        <v-btn color="secondary" icon="$add" size="x-large" />
      </v-card-text>
    </v-card>
    <translation-section
      :translation="selected ?? undefined"
      @close="close"
      @update="update"
    />
  </layout>
</template>

<script lang="ts">
import { has } from 'lodash-es';
import { defineComponent, ref } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import type {
  LanguageEntry,
  LanguageTranslationAttributes,
  LanguageTranslationsResponse,
} from '@intake24/common/types/http/admin';
import { copy } from '@intake24/common/util';
import { ConfirmDialog, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

import TranslationSection from './translation-section.vue';

export type LanguageTranslationsForm = { translations: LanguageTranslationsResponse };

export default defineComponent({
  name: 'LanguageTranslations',

  components: { ConfirmDialog, TranslationSection },

  mixins: [formMixin],

  setup(props) {
    const http = useHttp();
    const { i18n } = useI18n();

    const messages = useMessages();
    const { entry, entryLoaded } = useEntry<LanguageEntry>(props);
    useEntryFetch(props);
    const { form: { data, errors, put }, nonInputErrors, routeLeave, toForm } = useEntryForm<
      LanguageTranslationsForm,
      LanguageEntry
    >(props, {
      data: { translations: [] },
      nonInputErrorKeys: ['translations'],
    });

    const selected = ref<LanguageTranslationAttributes | null>(null);

    function getSectionTitle(key: string) {
      const check = has(i18n.messages.value[i18n.locale.value], `${key}.title`);
      if (check)
        return i18n.t(`${key}.title`);

      return i18n.t(`languages.translations.sections.${key}`);
    };

    function edit(translation: LanguageTranslationAttributes) {
      selected.value = translation;
    };

    function update(translation: LanguageTranslationAttributes) {
      const match = data.value.translations.find(item => item.id === translation.id);

      if (match)
        match.messages = copy(translation.messages);
    };

    function close() {
      selected.value = null;
    };

    function notify(action: string) {
      messages.success(
        i18n.t(`languages.translations.${action}`, { name: entry.value.englishName }),
      );
    };

    async function create() {
      const { data: translations } = await http.post<LanguageTranslationsResponse>(
        `admin/languages/${props.id}/translations`,
        {},
        { withLoading: true },
      );

      toForm({ translations });
      notify('created');
    };

    async function save() {
      const translations = await put<LanguageTranslationsResponse>(
        `admin/languages/${props.id}/translations`,
      );

      toForm({ translations });
      notify('updated');
    };

    async function remove() {
      await http.delete(`admin/languages/${props.id}/translations`, { withLoading: true });
      toForm({ translations: [] });

      notify('deleted');
    };

    async function sync() {
      const { data: translations } = await http.post<LanguageTranslationsResponse>(
        `admin/languages/${props.id}/translations/sync`,
        {},
        { withLoading: true },
      );

      toForm({ translations });
      notify('synced');
    };

    return {
      close,
      create,
      edit,
      entry,
      entryLoaded,
      data,
      errors,
      getSectionTitle,
      messages,
      nonInputErrors,
      remove,
      routeLeave,
      save,
      selected,
      sync,
      toForm,
      update,
    };
  },

  async mounted() {
    const { data: translations } = await this.$http.get<LanguageTranslationsResponse>(
      `admin/languages/${this.id}/translations`,
    );

    this.toForm({ translations });
  },
});
</script>

<style lang="scss" scoped></style>
