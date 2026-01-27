<template>
  <v-list-item link :to="{ name: item.name }">
    <template #prepend>
      <v-icon size="small">
        {{ item.icon }}
      </v-icon>
    </template>
    <v-list-item-title>{{ title }}</v-list-item-title>
  </v-list-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Resource } from '@intake24/admin/types';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MenuItem',

  props: {
    item: {
      type: Object as PropType<Resource>,
      required: true,
    },
  },

  computed: {
    title(): string {
      const { name, title } = this.item;
      return this.$t(title ?? `${name}.title`);
    },
  },
});
</script>

<style lang="scss">
</style>
