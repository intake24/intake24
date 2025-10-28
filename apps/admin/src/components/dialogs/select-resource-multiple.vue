<!-- eslint-disable vue/no-template-shadow -->
<template>
  <v-dialog
    v-model="dialog"
    :disabled="readonly"
    :fullscreen="$vuetify.display.smAndDown"
    max-width="600px"
  >
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-label>{{ label }}</v-label>
        <div class="d-flex flex-column ga-2 mt-4">
          <div class="pa-2 pl-0">
            <div v-if="modelValue.length" class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="item in modelValue"
                :key="item[itemId]"
                closable
                :disabled="disabled"
                @click:close="removeFromSelection(item[itemId])"
              >
                {{ item[itemName] }}
                <template #close>
                  <v-icon>
                    fa fa-remove
                  </v-icon>
                </template>
              </v-chip>
            </div>

            <div
              v-else
              style="min-height: 32px; display: flex; align-items: center;"
            >
              {{ $t('common.noneSelected') }}
            </div>
          </div>

          <div class="d-flex ga-2 align-center">
            <v-btn
              v-bind="props"
              class="text-none"
              color="primary"
              variant="tonal"
            >
              {{ $t('common.action.select') }}
            </v-btn>

            <v-btn
              v-if="clearable && modelValue.length"
              class="text-none"
              color="error"
              variant="text"
              @click.stop="clearInput"
            >
              {{ $t('common.action.clear') }}
            </v-btn>
          </div>
        </div>
      </slot>
    </template>

    <v-card :loading="loading">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          <slot name="title">
            {{ $t(`${resource}.title`) }}
          </slot>
        </v-toolbar-title>
        <v-spacer />
        <v-chip v-if="tempSelected.length" color="primary" size="small">
          {{ tempSelected.length }} {{ $t('common.selected') }}
        </v-chip>
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
          @click:clear="clearSearch"
        />

        <template v-if="items.length">
          <v-list
            class="list-border"
            density="compact"
          >
            <v-list-item
              v-for="item in items"
              :key="`${item[itemId]}:${item[itemName]}`"
              :active="isSelected(item)"
              color="secondary"
              :value="item[itemId]"
              @click="toggleSelection(item)"
            >
              <template #prepend>
                <v-list-item-action class="mr-2">
                  <v-checkbox-btn
                    :model-value="isSelected(item)"
                    @click.stop
                    @update:model-value="toggleSelection(item)"
                  />
                </v-list-item-action>
                <v-icon>{{ itemIcon }}</v-icon>
              </template>

              <slot name="item" v-bind="{ item }">
                <v-list-item-title>{{ item[itemName] }}</v-list-item-title>
              </slot>
            </v-list-item>
          </v-list>

          <div class="text-center mt-4">
            <v-pagination v-model="page" :length="lastPage" rounded />
          </div>
        </template>

        <v-alert v-else color="secondary" type="info">
          {{ $t('common.search.none') }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-btn color="error" variant="text" @click.stop="cancel">
          <v-icon icon="$cancel" start /> {{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="info"
          :disabled="!tempSelected.length"
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
import { computed, ref, watch } from 'vue';
import { useFetchList } from '@intake24/admin/composables';
import { getResource } from '@intake24/admin/router/resources';
import type { Dictionary } from '@intake24/common/types';
import { copy } from '@intake24/common/util';

defineOptions({
  name: 'SelectResourceMultiDialog',
  inheritAttrs: false,
});

const props = defineProps({
  clearable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  errorMessages: { type: Array as PropType<string[]>, default: () => [] },
  itemId: { type: String, default: 'id' },
  itemName: { type: String, default: 'name' },
  label: { type: String },
  name: { type: String },
  query: { type: Object as PropType<Dictionary>, default: () => ({}) },
  readonly: { type: Boolean, default: false },
  resource: { type: String, required: true },
  modelValue: {
    type: [Array] as PropType<(Dictionary)[]>,
    default: () => [],
  },
});

const emit = defineEmits(['clear', 'update:modelValue']);

const tempSelected = ref<Dictionary[]>([]);

const { dialog, loading, page, lastPage, search, items, clear } = useFetchList<Dictionary>({
  query: props.query,
  url: `/admin/references/${props.resource}`,
});

const itemIcon = computed(() => getResource(props.resource)?.icon ?? 'fas fa-list');

function isSelected(item: Dictionary): boolean {
  return tempSelected.value.findIndex(i => i[props.itemId] === item[props.itemId]) > -1;
}

function toggleSelection(item: Dictionary) {
  const id = item[props.itemId];
  const index = tempSelected.value.findIndex(i => i[props.itemId] === id);

  if (index > -1) {
    tempSelected.value.splice(index, 1);
  }
  else {
    tempSelected.value.push(copy(item));
  }
}

function close() {
  tempSelected.value = [];
  dialog.value = false;
}

function update(selectedItems: Dictionary[]) {
  emit('update:modelValue', selectedItems);
}

function removeFromSelection(id: string) {
  const selectedItems = props.modelValue.filter(i => i[props.itemId] !== id);
  update(selectedItems);
}

function clearInput() {
  update([]);
  emit('clear');
}

function clearSearch() {
  clear();
}

function cancel() {
  close();
}

function confirm() {
  update(tempSelected.value);
  close();
}

watch(dialog, (visible) => {
  if (visible) {
    tempSelected.value = props.modelValue.map(item => copy(item));
  }
});
</script>

<style scoped>
.list-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
</style>
