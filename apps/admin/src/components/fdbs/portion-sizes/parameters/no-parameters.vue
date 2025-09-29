<template>
  <v-alert type="info">
    {{ $t('fdbs.portionSizes.noParameters') }}
  </v-alert>
</template>

<script lang="ts" setup>
defineOptions({ name: 'NoParameters' });

defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});
</script>
