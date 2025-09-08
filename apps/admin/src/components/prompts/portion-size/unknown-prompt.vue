<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-3">
      <v-col cols="12" />
    </v-row>
  </v-tabs-window-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'UnknownPrompt',

  mixins: [basePrompt],
});
</script>

<style lang="scss" scoped></style>
