<template>
  <v-btn
    class="px-4"
    :color="color"
    :disabled="disabled"
    size="large"
    :title="currentLabel"
    variant="flat"
  >
    <v-icon v-if="icon" start>
      {{ icon }}
    </v-icon>
    <slot>
      {{ currentLabel }}
    </slot>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { useI18n } from '@intake24/ui';

const props = defineProps({
  color: {
    type: String,
    default: 'primary',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: '$next',
  },
  label: {
    type: String,
  },
});

const { i18n: { t } } = useI18n();

const currentLabel = computed(() => props.label ?? t('recall.actions.next'));
</script>

<style lang="scss" scoped></style>
