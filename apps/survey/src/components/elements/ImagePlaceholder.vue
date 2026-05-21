<template>
  <div class="d-flex h-100 w-100 align-center justify-center">
    <v-progress-circular
      v-bind="{ color, size, width }"
      indeterminate
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ImagePlaceholder',

  props: {
    color: {
      type: String,
      default: 'secondary',
    },
    size: {
      type: Number,
      default: 100,
    },
    width: {
      type: Number,
      default: 10,
    },
  },
});
</script>

<style lang="scss" scoped>
</style>
