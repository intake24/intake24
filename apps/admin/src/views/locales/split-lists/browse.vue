<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="save">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('locales.split-lists.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        :title="$t('locales.split-lists.add')"
        @click.stop="add"
      />
    </v-toolbar>
    <v-list class="list-border">
      <v-list-item v-for="(item, idx) in data.items" :key="idx">
        <template #prepend>
          <v-icon>fas fa-arrows-split-up-and-left</v-icon>
        </template>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.trim="item.firstWord"
              class="my-1"
              density="compact"
              hide-details="auto"
              :label="$t('locales.split-lists.firstWord')"
              name="firstWord"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md>
            <v-text-field
              v-model.trim="item.words"
              class="my-1"
              density="compact"
              hide-details="auto"
              :label="$t('locales.split-lists.words')"
              name="words"
              variant="outlined"
            />
          </v-col>
        </v-row>
        <template #append>
          <v-list-item-action>
            <confirm-dialog
              color="error"
              icon
              icon-left="$delete"
              :label="$t('locales.split-lists.remove')"
              @confirm="remove(idx)"
            >
              {{ $t('common.action.confirm.delete', { name: item.firstWord }) }}
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
  SplitListAttributes,
  SplitListRequest,
} from '@intake24/common/types/http/admin';

import { defineComponent, onMounted } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { useEntry as useStoreEntry } from '@intake24/admin/stores';
import { ConfirmDialog } from '@intake24/ui';

export type SplitListsForm = { items: SplitListRequest[] };

export default defineComponent({
  name: 'SplitLists',

  components: { ConfirmDialog },

  mixins: [formMixin],

  setup(props) {
    const http = useHttp();

    const { entry, entryLoaded } = useEntry<LocaleEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors, post }, routeLeave, submit, toForm } = useEntryForm<
      SplitListsForm,
      LocaleEntry
    >(props, {
      data: { items: [] },
      config: { transform: ({ items }) => items },
    });

    function add() {
      data.value.items.push({ localeId: props.id, firstWord: '', words: '' });
    };

    function remove(index: number) {
      data.value.items.splice(index, 1);
    };

    async function save() {
      data.value.items = data.value.items.filter(({ firstWord, words }) => firstWord && words);

      const items = await post<SplitListAttributes[]>(`admin/locales/${props.id}/split-lists`);

      useStoreEntry().setEntry({ items });
    };

    onMounted(async () => {
      const { data: items } = await http.get<SplitListAttributes[]>(
        `admin/locales/${props.id}/split-lists`,
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
    };
  },
});
</script>

<style lang="scss" scoped></style>
