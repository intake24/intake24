<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-text-field
          v-bind="{
            ...$attrs,
            ...props,
            clearable,
            disabled,
            errorMessages,
            label,
            modelValue: selectedItemName,
            name,
            prependInnerIcon: itemIcon,
          }"
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
        <template v-if="items.length">
          <v-list
            v-model:selected="selectedItemId"
            class="list-border"
            density="compact"
            min-height="350px"
          >
            <v-list-item v-for="item in items" :key="item[itemId]" :value="item[itemId]">
              <template #prepend="{ isSelected, select }">
                <v-list-item-action class="mr-2">
                  <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
                </v-list-item-action>
                <v-icon>{{ itemIcon }}</v-icon>
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
          :disabled="!selectedItemId.length"
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
import { computed, onMounted, ref, watch } from 'vue';

import { useFetchList } from '@intake24/admin/composables';
import { getResource } from '@intake24/admin/router/resources';
import type { Dictionary } from '@intake24/common/types';
import { copy } from '@intake24/common/util';

defineOptions({
  name: 'SelectResourceDialog',
  inheritAttrs: false,
});

const props = defineProps({
  clearable: {
    type: Boolean,
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
  resource: {
    type: String,
    required: true,
  },
  returnObject: {
    type: [Boolean, String],
    default: false,
  },
  modelValue: {
    type: [Object, String] as PropType<Dictionary | string | null>,
  },
});

const emit = defineEmits(['clear', 'update:modelValue']);

const selectedItemId = ref<string[]>(
  props.initialItem
    ? [props.initialItem[props.itemId]]
    : props.modelValue
      ? [typeof props.modelValue === 'string' ? props.modelValue : props.modelValue[props.itemId]]
      : [],
);

const { dialog, get, loading, page, lastPage, search, items, clear } = useFetchList<Dictionary>(
  { query: props.query, url: `/admin/references/${props.resource}` },
);

if (props.initialItem)
  items.value.push(props.initialItem);

const itemIcon = computed(() => getResource(props.resource)?.icon ?? 'fas fa-list');
const selectedItem = computed(() => items.value.find(item => item[props.itemId] === selectedItemId.value.at(0)));
const selectedItemName = computed(() => selectedItem.value?.[props.itemName] ?? props.modelValue);

function close() {
  dialog.value = false;
};

function update() {
  if (!selectedItem.value) {
    emit('update:modelValue', null);
    return;
  }

  let returnValue: Dictionary | string | null = selectedItemId.value[0];

  if (typeof props.returnObject === 'boolean')
    returnValue = props.returnObject ? copy(selectedItem.value) : selectedItemId.value[0];
  else returnValue = selectedItem.value[props.returnObject];

  emit('update:modelValue', returnValue);
};

function clearInput() {
  selectedItemId.value = [];
  update();
  emit('clear');
};

function confirm() {
  update();
  close();
};

async function fetchInitialEntry() {
  if (props.initialItem || !props.modelValue)
    return;

  const id = typeof props.modelValue === 'string' ? props.modelValue : props.modelValue[props.itemId];
  const data = await get(id);

  const match = data.find(item => item[props.itemId] === id);
  if (!match)
    return;

  items.value = [];
  items.value.push(match);
  selectedItemId.value = [match[props.itemId]];
};

onMounted(async () => {
  await fetchInitialEntry();
});

watch(
  () => props.modelValue,
  (val) => {
    if (val === selectedItemId.value.at(0))
      return;

    if (!val) {
      selectedItemId.value = [];
      return;
    }

    selectedItemId.value = [typeof val === 'string' ? val : val[props.itemId]];
  },
);
</script>
