<template>
  <icon class="standard-unit__svg" :icon="icon ?? ''" />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { Icon } from '@iconify/vue';

defineProps({
  icon: {
    type: String as PropType<string | null>,
  },
});
</script>

<style lang="scss" scoped>
.standard-unit__svg {
  height: auto;
  width: 100%;
  max-width: 150px;
}
</style>
