<template>
  <v-dialog max-width="350px" :model-value="modelValue.dialog" @update:model-value="handleLeave">
    <v-card>
      <v-card-title class="h2 justify-center">
        {{ $t('common.action.confirm.title') }}
      </v-card-title>
      <v-card-text class="px-6 py-4 d-flex justify-center">
        <div class="text-subtitle-1">
          {{ $t('common.action.confirm.msg') }}
        </div>
      </v-card-text>
      <v-card-text>
        <v-btn
          block
          class="mb-4"
          color="warning"
          size="large"
          :title="$t('common.action.continue')"
          @click.stop="confirmLeave"
        >
          {{ $t('common.action.continue') }}
        </v-btn>
        <v-btn
          block
          color="warning"
          size="large"
          :title="$t('common.action.cancel')"
          variant="outlined"
          @click.stop="cancelLeave"
        >
          {{ $t('common.action.cancel') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { RouteLeave } from '@intake24/admin/types';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ConfirmLeaveDialog',

  props: {
    modelValue: {
      type: Object as PropType<RouteLeave>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  methods: {
    handleLeave(value: boolean) {
      if (value)
        return;

      this.cancelLeave();
    },

    cancelLeave() {
      this.$emit('update:modelValue', { dialog: false, to: null, confirmed: false });
    },

    async confirmLeave() {
      const { dialog, to } = this.modelValue;

      if (!to)
        return;

      this.$emit('update:modelValue', { dialog, to, confirmed: true });
      await this.$router.push(to);
    },
  },
});
</script>
