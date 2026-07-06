<template>
  <v-toolbar color="surface">
    <v-toolbar-title class="font-weight-medium">
      <div class="text-headline-small">
        {{ $t('common.options._') }}
      </div>
    </v-toolbar-title>
    <v-spacer />
    <v-btn v-if="!readonly" color="primary" icon="$add" size="small" :title="$t('common.options.add')" @click.stop="add" />
  </v-toolbar>
  <v-divider />
  <v-list class="list-border" density="compact">
    <vue-draggable
      v-model="currentOptions"
      :animation="300"
      handle=".drag-and-drop__handle"
      @end="update"
    >
      <v-list-item
        v-for="(option, idx) in currentOptions"
        :key="option.id"
        :ripple="false"
      >
        <template #prepend>
          <v-drag-and-drop-handle />
        </template>
        <div class="d-flex flex-column align-stretch align-lg-stretch gr-2 pa-2">
          <v-text-field
            v-model="option.label"
            density="compact"
            hide-details="auto"
            :label="$t('common.options.label')"
            variant="outlined"
          />
          <v-text-field
            v-model="option.shortLabel"
            density="compact"
            hide-details="auto"
            :label="$t('common.options.shortLabel')"
            variant="outlined"
          />
          <slot :name="`value.${idx}`">
            <v-text-field
              v-model="option.value"
              density="compact"
              hide-details="auto"
              :label="$t('common.options.value')"
              :rules="optionValueRules"
              variant="outlined"
            />
          </slot>
          <v-expand-transition>
            <select-resource
              v-if="!!option.action"
              v-model="option.action.params.code"
              item-id="code"
              :label="$t('common.options.action.foodCode')"
              resource="foods"
            >
              <template #title>
                {{ $t('fdbs.foods.title') }}
              </template>
              <template #item="{ item }">
                <v-list-item-title>{{ item.code }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
              </template>
            </select-resource>
          </v-expand-transition>
          <div class="d-flex flex-column flex-sm-row gc-6 px-2">
            <v-switch
              v-model="option.selected"
              density="compact"
              hide-details="auto"
              :label="$t('common.options.selected')"
            />
            <v-switch
              v-if="exclusive"
              v-model="option.exclusive"
              density="compact"
              hide-details="auto"
              :label="$t('common.options.exclusive')"
            />
            <v-switch
              density="compact"
              hide-details="auto"
              :label="$t('common.options.action.updateFood')"
              :model-value="!!option.action"
              @update:model-value="changeActionToggle(option, $event)"
            />
          </div>
        </div>
        <template #append>
          <v-list-item-action v-if="!readonly">
            <v-btn color="error" icon="$delete" :title="$t('common.options.remove')" @click.stop="remove(idx)" />
          </v-list-item-action>
        </template>
      </v-list-item>
    </vue-draggable>
  </v-list>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { ZodType } from 'zod';

import type { RuleCallback } from '@intake24/admin/types';
import type { ListOption } from '@intake24/common/types';

import { deepEqual } from 'fast-equals';
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { toIndexedList } from '@intake24/admin/util';

defineOptions({ name: 'OptionsList' });

const props = defineProps({
  default: {
    type: [String, Number, Array] as PropType<string | number | unknown[]>,
  },
  exclusive: {
    type: Boolean,
  },
  numeric: {
    type: Boolean,
  },
  options: {
    type: Array as PropType<ListOption<ZodType>[]>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array as PropType<RuleCallback[]>,
    default: () => [],
  },
});

const emit = defineEmits(['update:options']);

const currentOptions = ref(toIndexedList(props.options));

const defaultValueRules = [
  (value: string | null): boolean | string => {
    const values = currentOptions.value.filter(item => item.value === value);
    return values.length < 2 || 'Value is already used.';
  },
];

const outputOptions = computed<ListOption<ZodAny>[]>(() => currentOptions.value.map(({ id, ...rest }) => (rest)));
const optionValueRules = computed<RuleCallback[]>(() => [...defaultValueRules, ...props.rules]);

function add() {
  const size = currentOptions.value.length + 1;
  currentOptions.value.push({ id: size, label: `label-${size}`, shortLabel: `shortLabel-${size}`, value: props.default ?? (props.numeric ? size : `value-${size}`) });
};

function remove(index: number) {
  currentOptions.value.splice(index, 1);
};

function changeActionToggle(option: ListOption<ZodType>, enable: boolean | null) {
  if (enable) {
    option.action = { type: 'updateFood', params: { code: 'FOOD_CODE' } };
  }
  else {
    option.action = undefined;
  }
};

function update() {
  emit('update:options', outputOptions.value);
};

watch(() => props.options, (val) => {
  if (deepEqual(val, outputOptions.value))
    return;

  currentOptions.value = toIndexedList(val);
});

watch(outputOptions, () => {
  update();
}, { deep: true });
</script>

<style lang="scss" scoped>
</style>
