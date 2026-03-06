<template>
  <v-chip v-if="amount" class="font-weight-medium" :color="color" link size="small">
    {{ amountWithUnit }}
  </v-chip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'QuantityBadge',

  props: {
    amount: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'g',
    },
    valid: {
      type: Boolean,
      required: true,
    },
  },

  computed: {
    color() {
      return this.valid ? 'primary' : undefined;
    },

    amountWithUnit(): string {
      return this.amount > 0 ? `${Math.round(this.amount)}${this.unit}` : '';
    },
  },
});
</script>

<style></style>
