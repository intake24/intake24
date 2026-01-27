<template>
  <v-autocomplete
    v-bind="{
      clearable,
      errorMessages,
      hideDetails,
      hideNoData,
      hideSelected,
      name,
      items,
      itemText,
      itemValue,
      label,
      loading: isLoading,
      outlined,
      prependIcon,
      modelValue,
    }"
    v-model:search="search"
    @update:model-value="input($event)"
  />
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Dictionary } from '@intake24/common/types';

import { watchDebounced } from '@vueuse/core';
import { defineComponent, ref, watch } from 'vue';

import { useHttp } from '@intake24/admin/services';

export default defineComponent({
  name: 'AutoComplete',

  props: {
    api: {
      type: String,
      required: true,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    hideDetails: {
      type: String as PropType<'auto' | boolean | undefined>,
      default: 'auto',
    },
    hideNoData: {
      type: Boolean,
      default: false,
    },
    hideSelected: {
      type: Boolean,
      default: false,
    },
    errorMessages: {
      type: Array as PropType<string[]>,
    },
    itemText: {
      type: String,
      default: 'name',
    },
    itemValue: {
      type: String,
      default: 'id',
    },
    name: {
      type: String,
    },
    label: {
      type: String,
    },
    outlined: {
      type: Boolean,
      default: true,
    },
    prependIcon: {
      type: String,
    },
    modelValue: {
      type: String as PropType<string | null>,
    },
    selected: {
      type: Object as PropType<Dictionary>,
    },
    responseObject: {
      type: String,
    },
  },

  emits: ['update:modelValue', 'update:object'],

  setup(props, { emit }) {
    const http = useHttp();

    const isLoading = ref(false);
    const search = ref<string | undefined>(undefined);
    const items = ref<Dictionary[]>([]);

    if (props.selected)
      items.value.push(props.selected);

    function input(value: any) {
      const object = items.value.find(item => item[props.itemValue] === value);
      emit('update:modelValue', value);
      emit('update:object', object);
    };

    function resolveResponseObject(data: any) {
      if (!props.responseObject)
        return data;

      const segments = props.responseObject.split('.');
      return segments.reduce((acc, segment) => acc[segment], data);
    };

    async function fetchItems() {
      if (isLoading.value)
        return;

      isLoading.value = true;

      try {
        const { data } = await http.get(props.api, { params: { search: search.value } });

        items.value = resolveResponseObject(data);
      }
      finally {
        isLoading.value = false;
      }
    };

    watchDebounced(
      search,
      () => {
        fetchItems();
      },
      { debounce: 500, maxWait: 2000 },
    );

    watch(() => props.selected, (val) => {
      if (!val)
        return;

      items.value = [val];
    });

    return { isLoading, input, items, search };
  },
});
</script>
