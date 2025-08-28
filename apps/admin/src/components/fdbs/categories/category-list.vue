<template>
  <v-card v-bind="{ border, flat, tile }">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        <slot name="title">
          {{ $t('fdbs.categories.title') }}
        </slot>
      </v-toolbar-title>
      <v-spacer />
      <select-resource
        v-if="!disabled"
        :except="items"
        item-id="code"
        :label="$t('fdbs.categories._')"
        :query="{ localeId }"
        resource="categories"
        return-object
        @update:model-value="add"
      >
        <template #activator="{ props }">
          <v-btn color="primary" icon="$add" size="small" :title="$t('fdbs.categories.add')" v-bind="props" />
        </template>
        <template #title>
          {{ $t(`fdbs.categories.title`) }}
        </template>
        <template #item="{ item }">
          <v-list-item-title>{{ item.code }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
        </template>
      </select-resource>
    </v-toolbar>
    <v-list class="list-border py-0">
      <v-list-item v-for="item in items" :key="item.code" link>
        <template #prepend>
          <v-icon>$categories</v-icon>
        </template>
        <slot name="item.content" v-bind="{ item }">
          <v-list-item-title>{{ item.code }} | {{ item.name }}</v-list-item-title>
        </slot>
        <template #append>
          <slot name="item.action" v-bind="{ item }" />
          <v-list-item-action v-if="!disabled">
            <confirm-dialog
              color="error"
              icon
              icon-left="$delete"
              :label="$t('fdbs.categories.remove')"
              @confirm="remove(item.code)"
            >
              {{ $t('common.action.confirm.remove', { name: item.name }) }}
            </confirm-dialog>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
    <error-list
      v-if="errors?.has('parentCategories')"
      class="px-4 pb-2"
      :errors="errors.get('parentCategories')"
    />
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { CategoryListItem } from './categories';
import { useVModel } from '@vueuse/core';
import { SelectResource } from '@intake24/admin/components/dialogs';
import type { ReturnUseErrors } from '@intake24/admin/composables/use-errors';
import { ConfirmDialog } from '@intake24/ui';
import { ErrorList } from '../../forms';

const props = defineProps({
  border: {
    type: [Boolean, String, Number],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object as PropType<ReturnUseErrors>,
  },
  flat: {
    type: Boolean,
    default: true,
  },
  localeId: {
    type: String,
  },
  tile: {
    type: Boolean,
  },
  modelValue: {
    type: Array as PropType<CategoryListItem[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const items = useVModel(props, 'modelValue', emit, {
  passive: true,
  deep: true,
});

function add(categories: CategoryListItem) {
  items.value.push(categories);
}

function remove(code: string) {
  items.value = items.value.filter(item => item.code !== code);
}
</script>
