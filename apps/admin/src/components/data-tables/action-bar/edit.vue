<template>
  <v-btn
    :title="internalTitle"
    :to="internalTo"
  >
    <v-icon>
      {{ icon }}
    </v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import ActionMixin from './action-mixin';

export default defineComponent({
  name: 'EditAction',

  mixins: [ActionMixin],
});
</script>

<style lang="scss" scoped></style>
