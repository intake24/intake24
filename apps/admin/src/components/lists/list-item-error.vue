<template>
  <v-chip v-if="errors.length" color="error" variant="flat">
    {{ $t('common.errors', { count: errors.length }) }}
  </v-chip>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

defineProps({
  errors: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});
</script>
