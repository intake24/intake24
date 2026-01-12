<template>
  <v-dialog v-model="dialog" :max-width="maxWidth" :persistent="persistent">
    <template v-if="!external" #activator="{ props: dProps }">
      <slot name="activator" v-bind="{ props: dProps }">
        <v-btn
          v-if="show"
          v-bind="{
            ...dProps,
            class: activatorClass,
            color: iconColor ? iconColor : color,
            disabled,
            icon,
            rounded,
            size,
            title: label,
            variant,
          }"
        >
          <v-icon :start="!icon && !!iconLeft">
            {{ iconLeft }}
          </v-icon>
          <template v-if="!icon">
            {{ label }}
          </template>
        </v-btn>
      </slot>
    </template>
    <v-card>
      <v-card-title class="text-h4 d-flex justify-center">
        <slot name="title">
          {{ titleLabel }}
        </slot>
      </v-card-title>
      <v-card-text class="px-6 py-4">
        <div class="text-subtitle-1 d-flex justify-center">
          <slot />
        </div>
      </v-card-text>
      <template v-if="typedConfirm">
        <v-divider />
        <v-card-text class="px-6 py-4">
          <i18n-t class="text-subtitle-1 mb-2" keypath="common.action.confirm.typed" tag="p">
            <template #name>
              <code class="font-weight-bold text-error">{{ `DELETE ${typedConfirm}` }}</code>
            </template>
          </i18n-t>
          <v-text-field
            v-model="confirmInput"
            class="text-error"
            color="error"
            density="compact"
            hide-details="auto"
          />
        </v-card-text>
      </template>
      <v-container class="pa-6">
        <v-expand-transition>
          <v-btn
            v-if="canConfirm"
            block
            class="mb-3"
            :color="color"
            size="large"
            :title="confirmLabel"
            @click.stop="confirm"
          >
            <v-icon v-if="confirmIcon" start>
              {{ confirmIcon }}
            </v-icon>{{ confirmLabel }}
          </v-btn>
        </v-expand-transition>

        <v-btn block :color="color" size="large" :title="cancelLabel" variant="outlined" @click.stop="cancel">
          <v-icon v-if="cancelIcon" start>
            {{ cancelIcon }}
          </v-icon>{{ cancelLabel }}
        </v-btn>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed, ref, watch } from 'vue';

import { useI18n } from '@intake24/ui';

defineOptions({ name: 'ConfirmDialog' });

const props = defineProps({
  activatorClass: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  color: {
    type: String,
    default: 'info',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  external: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: Boolean,
    default: false,
  },
  iconColor: {
    type: String,
  },
  iconLeft: {
    type: String,
  },
  label: {
    type: String,
    required: true,
  },
  confirmIcon: {
    type: String,
  },
  confirmText: {
    type: String,
  },
  cancelIcon: {
    type: String,
  },
  cancelText: {
    type: String,
  },
  maxWidth: {
    type: String,
    default: '350px',
  },
  persistent: {
    type: Boolean,
    default: false,
  },
  show: {
    type: Boolean,
    default: true,
  },
  rounded: {
    type: [Boolean, String],
    default: 'md',
  },
  size: {
    type: String,
  },
  variant: {
    type: String as PropType<'flat' | 'elevated' | 'outlined' | 'text' | 'plain' | 'tonal'>,
  },
  titleText: {
    type: String,
  },
  typedConfirm: {
    type: String,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['cancel', 'close', 'confirm', 'update:modelValue']);

const dialog = ref(props.modelValue);

const { i18n: { t } } = useI18n();

const cancelLabel = computed(
  () => props.cancelText ?? t('common.action.cancel'),
);
const confirmLabel = computed(() => props.confirmText ?? props.label);
const titleLabel = computed(
  () => props.titleText ?? t('common.action.confirm.title'),
);

const confirmInput = ref('');
const canConfirm = computed(
  () => !props.typedConfirm || `DELETE ${props.typedConfirm}` === confirmInput.value,
);

function close() {
  dialog.value = false;
}

function cancel() {
  close();
  emit('cancel');
}

function confirm() {
  close();
  emit('confirm');
}

watch(() => props.modelValue, (val) => {
  dialog.value = val;
});

watch(dialog, (val) => {
  if (props.modelValue !== val)
    emit('update:modelValue', val);

  if (!val)
    emit('close');
});
</script>
