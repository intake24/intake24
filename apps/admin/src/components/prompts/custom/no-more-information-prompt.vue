<template>
  <v-tabs-window-item value="options" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'NoMoreInformationPrompt',

  mixins: [basePrompt],
});
</script>

<style lang="scss" scoped></style>
