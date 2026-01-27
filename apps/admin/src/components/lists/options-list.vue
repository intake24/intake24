<template>
  <v-toolbar flat tile>
    <v-toolbar-title class="font-weight-medium">
      <div class="text-h5">
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
          <v-avatar class="drag-and-drop__handle" icon="$handle" />
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
          <v-text-field
            v-model="option.value"
            density="compact"
            hide-details="auto"
            :label="$t('common.options.value')"
            :rules="optionValueRules"
            variant="outlined"
          />
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
import type { ZodNumber, ZodString } from 'zod';

import type { RuleCallback } from '@intake24/admin/types';
import type { ListOption } from '@intake24/common/types';

import { deepEqual } from 'fast-equals';
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { toIndexedList } from '@intake24/admin/util';

defineOptions({ name: 'OptionsList' });

const props = defineProps({
  exclusive: {
    type: Boolean,
  },
  numeric: {
    type: Boolean,
  },
  options: {
    type: Array as PropType<ListOption<ZodString | ZodNumber>[]>,
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

const outputOptions = computed<ListOption<ZodString | ZodNumber>[]>(() => currentOptions.value.map(({ id, ...rest }) => (rest)));
const optionValueRules = computed<RuleCallback[]>(() => [...defaultValueRules, ...props.rules]);

function add() {
  const size = currentOptions.value.length + 1;
  currentOptions.value.push({ id: size, label: `label-${size}`, shortLabel: `shortLabel-${size}`, value: props.numeric ? size : `value-${size}` });
};

function remove(index: number) {
  currentOptions.value.splice(index, 1);
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
