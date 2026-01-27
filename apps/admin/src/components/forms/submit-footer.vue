<template>
  <v-row class="mt-3" :justify="justify">
    <v-col cols="12" lg="3" md="4" sm="6">
      <v-btn
        block
        :color="color"
        :disabled="disabled || isAppLoading"
        size="x-large"
        :title="label ?? $t('common.action.save')"
        type="submit"
      >
        <v-icon :icon="icon" start />
        {{ label ?? $t('common.action.save') }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SubmitFooter',

  props: {
    color: {
      type: String,
      default: 'primary',
    },
    icon: {
      type: String,
      default: '$save',
    },
    justify: {
      type: String as PropType<'center' | 'end' | 'start' | 'space-around' | 'space-between' | 'space-evenly' | 'stretch'>,
      default: 'center',
    },
    label: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped></style>
