<template>
  <div class="d-flex img-placeholder">
    <v-progress-circular
      v-bind="{ color, size, width }"
      class="ma-auto"
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
      default: 'primary',
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
.img-placeholder {
  width: 100%;
  height: 100%;
}
</style>
