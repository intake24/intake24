<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-btn color="primary" icon="$add" size="small" :title="$t('fdbs.categories.add')" v-bind="props" />
    </template>
    <v-card :loading="loading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('fdbs.categories.title') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-6">
        <v-text-field
          v-model="search"
          class="mb-4"
          clearable
          hide-details="auto"
          :label="$t('common.search._')"
          :loading="loading"
          prepend-inner-icon="$search"
          variant="outlined"
          @click:clear="clear"
        />
        <v-alert v-if="isAlreadyIncluded" type="error">
          {{ $t('fdbs.categories.alreadyIncluded', { code: selectedItems[0].code }) }}
        </v-alert>
        <template v-if="items.length">
          <v-list v-model:selected="selected" class="list-border" density="compact" min-height="350px" select-strategy="leaf">
            <v-list-item v-for="(item) in items" :key="item.code" :value="item.code">
              <template #prepend="{ isSelected, select }">
                <v-list-item-action class="mr-2">
                  <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
                </v-list-item-action>
                <v-icon>fas fa-list</v-icon>
              </template>
              <v-list-item-title>{{ item.code }} | {{ item.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <div class="text-center">
            <v-pagination v-model="page" :length="lastPage" rounded />
          </div>
        </template>
        <v-alert v-else color="secondary" type="info">
          {{ $t('fdbs.categories.none') }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="close">
          <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          class="font-weight-bold"
          color="info"
          :disabled="!selected.length || isAlreadyIncluded"
          variant="text"
          @click.stop="confirm"
        >
          <v-icon icon="$success" start />{{ $t('common.action.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { CategoryListItem } from './categories';

import { defineComponent, ref, toRefs } from 'vue';
import { useFetchList } from '@intake24/admin/composables';
import type { CategoriesResponse, MainCategoriesResponse } from '@intake24/common/types/http/admin';

import { copy } from '@intake24/common/util';

export default defineComponent({
  name: 'AddCategoryDialog',

  props: {
    currentItems: {
      type: Array as PropType<CategoryListItem[]>,
      required: true,
    },
    localeId: {
      type: String,
    },
  },

  emits: ['add'],

  setup(props) {
    const { localeId } = toRefs(props);
    const selected = ref<string[]>([]);

    const { dialog, loading, page, lastPage, search, items, clear } = useFetchList<
      (CategoriesResponse | MainCategoriesResponse)['data'][number]
    >(localeId.value ? 'admin/fdbs/:id/categories' : 'admin/categories', localeId.value);

    return { dialog, loading, items, page, lastPage, search, selected, clear };
  },

  computed: {
    selectedItems() {
      const { selected } = this;
      if (!selected.length)
        return [];

      return this.items.filter(item => selected.includes(item.code));
    },
    isAlreadyIncluded() {
      if (!this.currentItems.length || !this.selectedItems.length)
        return false;
      const codes = this.currentItems.map(item => item.code);

      return this.selectedItems.some(item => codes.includes(item.code));
    },
  },

  methods: {
    close() {
      this.selected = [];
      this.dialog = false;
    },

    confirm() {
      if (!this.selectedItems.length)
        return;

      this.$emit('add', copy(this.selectedItems));
      this.close();
    },
  },
});
</script>
