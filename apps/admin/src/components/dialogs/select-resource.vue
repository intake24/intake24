<template>
  <v-dialog v-model="dialog" :disabled="readonly" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-combobox
          v-bind="{
            ...$attrs,
            ...props,
            clearable,
            disabled,
            errorMessages,
            label,
            modelValue: displayValue,
            name,
            prependInnerIcon: `$${resource}`,
          }"
          :chips="multiple"
          multiple
          readonly
          @click:clear="clearInput"
        />
      </slot>
    </template>
    <v-card :loading="loading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          <slot name="title">
            {{ $t(`${resource}.title`) }}
          </slot>
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
          {{ $t('fdbs.categories.alreadyIncluded', { code: selectedItemId?.at(0) }) }}
        </v-alert>
        <template v-if="items.length">
          <v-list
            v-model:selected="selectedItemId"
            class="list-border"
            density="compact"
            min-height="350px"
            :select-strategy="multiple ? 'leaf' : undefined"
            @click:select="onSelection"
          >
            <v-list-item v-for="item in items" :key="`${item[itemId]}:${item[itemName]}`" :value="item[itemId]">
              <template #prepend="{ isSelected, select }">
                <v-list-item-action class="mr-2">
                  <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
                </v-list-item-action>
                <v-icon :icon="`$${resource}`" />
              </template>
              <slot name="item" v-bind="{ item }">
                <v-list-item-title>{{ item[itemName] }}</v-list-item-title>
              </slot>
            </v-list-item>
          </v-list>
          <div class="text-center">
            <v-pagination v-model="page" :length="lastPage" rounded />
          </div>
        </template>
        <v-alert v-else color="secondary" type="info">
          {{ $t('common.search.none') }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="close">
          <v-icon icon="$cancel" start /> {{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          class="font-weight-bold"
          color="info"
          :disabled="!selectedItemId.length || isAlreadyIncluded"
          variant="text"
          @click.stop="confirm"
        >
          <v-icon icon="$success" start /> {{ $t('common.action.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Dictionary } from '@intake24/common/types';

import { isEqual } from 'lodash-es';
import { computed, onMounted, ref, toRefs, watch } from 'vue';

import { useFetchList } from '@intake24/admin/composables';
import { copy } from '@intake24/common/util';

type ModelValue = Dictionary | string | null | Dictionary[] | string[];

defineOptions({
  name: 'SelectResourceDialog',
  inheritAttrs: false,
});

const props = defineProps({
  clearable: {
    type: Boolean,
  },
  except: {
    type: Array as PropType<Dictionary[]>,
  },
  disabled: {
    type: Boolean,
  },
  errorMessages: {
    type: Array as PropType<string[]>,
  },
  initialItem: {
    type: [Object] as PropType<Dictionary | null>,
  },
  itemId: {
    type: String,
    default: 'id',
  },
  itemName: {
    type: String,
    default: 'name',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
  },
  name: {
    type: String,
  },
  query: {
    type: Object as PropType<Dictionary>,
    default: () => ({}),
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  resource: {
    type: String,
    required: true,
  },
  returnObject: {
    type: [Boolean, String],
    default: false,
  },
  modelValue: {
    type: [Array, Object, String] as PropType<ModelValue>,
  },
});

const emit = defineEmits(['clear', 'update:modelValue']);

function initValue(value?: ModelValue): string[] {
  if (!value)
    return [];

  if (Array.isArray(value))
    return value.map(val => typeof val === 'string' ? val : val[props.itemId]);

  return [typeof value === 'string' ? value : value[props.itemId]];
}

const { query } = toRefs(props);
const url = computed(() => `/admin/references/${props.resource}`);
const { dialog, get, loading, page, lastPage, search, items, clear } = useFetchList<Dictionary>({ query, url });

const selectedItemId = ref<string[]>(props.initialItem ? [props.initialItem[props.itemId]] : initValue(props.modelValue));
const selectedItems = ref<Dictionary[]>([]);
const confirmedItems = ref<Dictionary[]>([]);

if (props.initialItem)
  items.value.push(props.initialItem);

const displayValue = computed(() => confirmedItems.value.map(item => item[props.itemName]));

function onSelection({ id, value }: { id: unknown; value: boolean; path: unknown[]; event?: PointerEvent }) {
  const item = items.value.find(item => item[props.itemId] === id);
  if (!item)
    return;

  const index = selectedItems.value.findIndex(item => item[props.itemId] === id);

  if (!props.multiple) {
    selectedItems.value = value ? [copy(item)] : [];
    return;
  }

  if (value) {
    if (index !== -1)
      return;

    selectedItems.value.push(copy(item));
  }
  else {
    if (index === -1)
      return;

    selectedItems.value.splice(index, 1);
  }
}

const isAlreadyIncluded = computed(() => {
  if (!props.except?.length || !selectedItemId.value.length)
    return false;

  const codes = props.except.map(item => item[props.itemId]);

  return selectedItemId.value.some(item => codes.includes(item));
});

function update() {
  const { multiple, returnObject } = props;

  confirmedItems.value = copy(selectedItems.value);

  if (!multiple && !selectedItems.value.length) {
    emit('update:modelValue', null);
    return;
  }

  if (typeof returnObject === 'boolean') {
    if (returnObject) {
      emit('update:modelValue', copy(multiple ? selectedItems.value : selectedItems.value[0]));
    }
    else {
      emit('update:modelValue', multiple ? selectedItemId.value : selectedItemId.value[0]);
    }
    return;
  }

  emit('update:modelValue', multiple ? selectedItems.value.map(item => item[returnObject]) : selectedItems.value[0][returnObject]);
};

function clearSelection() {
  selectedItemId.value = [];
  selectedItems.value = [];
};

function clearInput() {
  confirmedItems.value = [];
  clearSelection();

  update();
  emit('clear');
};

function close() {
  dialog.value = false;
};

function confirm() {
  update();
  close();
};

async function fetchInitialEntry() {
  if (!selectedItemId.value.length)
    return;

  const data = await get(selectedItemId.value);

  const match = data.filter(item => selectedItemId.value.includes(item[props.itemId]));
  if (!match.length)
    return;

  selectedItems.value = copy(match);
  confirmedItems.value = copy(match);
};

onMounted(async () => {
  await fetchInitialEntry();
});

watch(dialog, async (val) => {
  if (val) {
    await fetchInitialEntry();
    return;
  }

  clearSelection();
});

watch(
  () => props.modelValue,
  (val) => {
    if (isEqual(initValue(val), selectedItemId.value))
      return;

    selectedItemId.value = initValue(val);
  },
);
</script>
