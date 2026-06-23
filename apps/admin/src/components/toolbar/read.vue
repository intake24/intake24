<template>
  <v-btn
    :disabled="disabled"
    :title="$t('common.action.read')"
    variant="tonal"
    @click.stop="onClick"
  >
    <v-icon :icon="icon" start />
    {{ $t('common.action.read') }}
  </v-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import ActionMixin from './action-mixin';

export default defineComponent({
  name: 'ReadAction',

  mixins: [ActionMixin],
});
</script>

<style lang="scss" scoped></style>
