<template>
  <v-dialog v-model="dialog" persistent width="290px">
    <template #activator="{ props }">
      <v-text-field
        :clearable="clearable"
        :error-messages="errorMessages"
        hide-details="auto"
        :label="label"
        :model-value="formattedValue"
        prepend-inner-icon="fas fa-calendar-days"
        readonly
        variant="outlined"
        v-bind="props"
        @click:clear="internalValue = null"
      />
    </template>
    <v-date-picker v-model="internalValue" scrollable>
      <template #actions>
        <v-btn class="font-weight-medium" color="error" variant="text" @click="dialog = false">
          {{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          class="font-weight-medium"
          color="secondary"
          variant="text"
          @click="update"
        >
          {{ $t('common.action.ok') }}
        </v-btn>
      </template>
    </v-date-picker>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { computed, ref, watch } from 'vue';
import { useDate } from 'vuetify';

import { formatDate } from '@intake24/admin/util';

defineOptions({ name: 'DatePicker' });

const props = defineProps({
  clearable: {
    type: Boolean,
  },
  errorMessages: {
    type: [String, Array] as PropType<string | string[]>,
  },
  label: {
    type: String,
  },
  modelValue: {
    type: [Date, String] as PropType<string | Date | null>,
  },
});

const emit = defineEmits(['update:modelValue']);

const adapter = useDate();

function toDate(val: string | Date | null | undefined): Date | null {
  if (val instanceof Date)
    return adapter.parseISO(val.toISOString().substring(0, 10)) as Date;

  if (typeof val === 'string')
    return adapter.parseISO(new Date(val).toISOString().substring(0, 10)) as Date;

  return null;
}

const dialog = ref(false);
const internalValue = ref(toDate(props.modelValue));
const formattedValue = computed(() => props.modelValue ? formatDate(props.modelValue, 'dd/MM/yyyy') : '');

watch(() => props.modelValue, (val) => {
  if (toDate(val) === internalValue.value)
    return;

  internalValue.value = toDate(val);
});

function update() {
  emit('update:modelValue', internalValue.value ? adapter.toISO(internalValue.value).substring(0, 10) : null);
  dialog.value = false;
}
</script>

<style scoped></style>
