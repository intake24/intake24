<template>
  <component :is="icon" class="standard-unit__svg" />
</template>

<script lang="ts" setup>
import { standardUnitIcons } from './standard-unit-icons';

defineOptions({
  components: { ...standardUnitIcons },
});

defineProps({
  icon: {
    type: String,
    required: true,
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
