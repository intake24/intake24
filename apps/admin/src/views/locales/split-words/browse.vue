<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="save">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('locales.split-words.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        :title="$t('locales.split-words.add')"
        @click.stop="add"
      />
    </v-toolbar>
    <v-alert
      class="ma-4"
      closable
      type="info"
    >
      <div class="d-flex flex-column gr-3">
        <span class="font-weight-medium text-subtitle-1">
          {{ $t('locales.split-words.hints._') }}
        </span>
        <span>
          <v-icon icon="fas fa-arrow-right" size="sm" start />
          {{ $t('locales.split-words.hints.list') }}
        </span>
        <span>
          <v-icon icon="fas fa-arrow-right" size="sm" start />
          {{ $t('locales.split-words.hints.space') }}
        </span>
        <span>
          <v-icon icon="fas fa-arrow-right" size="sm" start />
          {{ $t('locales.split-words.hints.force') }}
        </span>
      </div>
    </v-alert>
    <v-list class="list-border">
      <v-list-item v-for="(item, idx) in data.items" :key="idx">
        <template #prepend>
          <v-icon>fas fa-arrows-split-up-and-left</v-icon>
        </template>
        <v-text-field
          v-model="item.words"
          class="my-1"
          density="compact"
          hide-details="auto"
          :label="$t('locales.split-words.words')"
          name="words"
          variant="outlined"
        />
        <template #append>
          <v-list-item-action>
            <confirm-dialog
              color="error"
              icon
              icon-left="$delete"
              :label="$t('locales.split-words.remove')"
              @confirm="remove(idx)"
            >
              {{ $t('common.action.confirm.delete', { name: item.words }) }}
            </confirm-dialog>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </layout>
</template>

<script lang="ts">
import type {
  LocaleEntry,
  SplitWordAttributes,
  SplitWordRequest,
} from '@intake24/common/types/http/admin';

import { defineComponent, onMounted } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { useEntry as useStoreEntry } from '@intake24/admin/stores';
import { ConfirmDialog } from '@intake24/ui';

export type SplitWordsForm = { items: SplitWordRequest[] };

export default defineComponent({
  name: 'SplitWords',

  components: { ConfirmDialog },

  mixins: [formMixin],

  setup(props) {
    const http = useHttp();

    const { entry, entryLoaded } = useEntry<LocaleEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors, post }, routeLeave, submit, toForm } = useEntryForm<
      SplitWordsForm,
      LocaleEntry
    >(props, {
      data: { items: [] },
      config: { transform: ({ items }) => items },
    });

    function add() {
      data.value.items.push({ localeId: props.id, words: '' });
    };

    function remove(index: number) {
      data.value.items.splice(index, 1);
    };

    async function save() {
      data.value.items = data.value.items.filter(({ words }) => words);

      const items = await post<SplitWordAttributes[]>(`admin/locales/${props.id}/split-words`);

      useStoreEntry().setEntry({ items });
    };

    onMounted(async () => {
      const { data: items } = await http.get<SplitWordAttributes[]>(
        `admin/locales/${props.id}/split-words`,
      );

      toForm({ items });
    });

    return {
      add,
      entry,
      entryLoaded,
      clearError,
      data,
      errors,
      remove,
      routeLeave,
      save,
      submit,
      toForm,
    };
  },
});
</script>

<style lang="scss" scoped></style>
