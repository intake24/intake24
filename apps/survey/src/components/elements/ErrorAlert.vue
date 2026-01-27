<template>
  <v-alert v-if="errors.length" class="ma-0" color="error">
    <span v-for="(e, index) in errors" :key="index">{{ e }}</span>
  </v-alert>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ErrorAlert',

  props: {
    errors: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },
});
</script>

<style></style>
