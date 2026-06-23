<template>
  <v-dialog v-model="dialog" :disabled="readonly" :fullscreen="$vuetify.display.smAndDown" max-width="800px">
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-text-field
          v-bind="{
            label: $t('common.icons._'),
            name: 'icon',
            ...$attrs,
            ...props,
            errorMessages,
            modelValue,
          }"
          readonly
          @click:clear="clear"
        >
          <template v-if="modelValue" #prepend-inner>
            <iconify height="32" :icon="modelValue" width="32" />
          </template>
        </v-text-field>
      </slot>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar>
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('common.icons.select') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="d-flex flex-column ga-4">
        <v-text-field
          v-model="searchTerm"
          :label="$t('common.icons.search')"
          :loading
        />
        <div v-if="loading" class="d-flex justify-center align-center h-100 w-100 pa-10">
          <v-progress-circular
            v-bind="{ color: 'primary', size: 125, width: 15 }"
            indeterminate
          />
        </div>
        <v-item-group v-if="response" v-model="icon">
          <v-row density="compact">
            <v-col v-for="(item) in response.icons" :key="item" cols="4" md="3">
              <v-item
                v-slot="{ isSelected, toggle }"
                :value="item"
              >
                <v-card
                  class="pa-2 d-flex flex-column align-center justify-center fill-height"
                  color="primary"
                  :variant="isSelected ? 'flat' : 'tonal'"
                  @click="isSelected ? update() : update(toggle)"
                >
                  <iconify class="icon__iconify h-auto w-100 " :icon="item" />
                  <span class="text-center text-body-small">
                    {{ item.split(':').at(1) }}
                  </span>
                  <span class="text-center text-body-small font-weight-medium">
                    {{ response.collections[item.split(':').at(0) ?? '']?.name }}
                  </span>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-item-group>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { Icon as Iconify } from '@iconify/vue';
import { watchDebounced } from '@vueuse/core';
import axios, { isCancel } from 'axios';
import { ref, watch } from 'vue';

type IconSearchResponse = {
  collections: Record<string, any>;
  icons: string[];
  limit: number;
  request: {
    query: string;
  };
  start: number;
  total: number;
};

defineOptions({
  name: 'SelectIcon',
  inheritAttrs: false,
});

defineProps({
  errorMessages: {
    type: Array as PropType<string[]>,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const icon = defineModel('modelValue', { type: String as PropType<string | null>, default: null });

const dialog = ref(false);
const searchTerm = ref('');

const client = axios.create({ baseURL: 'https://api.iconify.design' });
let clientCtrl = new AbortController();
const loading = ref(false);
const response = ref<IconSearchResponse | null>(null);

function cancelRequest() {
  clientCtrl.abort();
  clientCtrl = new AbortController();
}

watch(dialog, (value) => {
  if (!value) {
    return;
  }

  const match = response.value?.icons.find(item => item === icon.value);

  if (icon.value && !match) {
    searchTerm.value = icon.value.split(':').at(1) ?? '';
  }
});

watchDebounced(searchTerm, async (value) => {
  await search(value);
}, { debounce: 500 });

async function search(value: string) {
  if (!value || value.length < 3) {
    response.value = null;
    return;
  }

  cancelRequest();
  loading.value = true;

  try {
    const { data } = await client.get<IconSearchResponse>('search', {
      params: {
        query: value,
        limit: 999,
      },
    });
    response.value = data;
  }
  catch (err) {
    if (isCancel(err))
      return;

    throw err;
  }
  finally {
    loading.value = false;
  }
};

function update(toggle?: () => void) {
  toggle?.();
  close();
}

function clear() {
  icon.value = null;
};

function close() {
  dialog.value = false;
};
</script>

<style lang="scss" scoped>
.icon__iconify {
  max-width: 75px;
}
</style>
