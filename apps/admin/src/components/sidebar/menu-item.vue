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

import { defineComponent } from 'vue';

type MenuItem = {
  name: string;
  icon: string;
  title?: string;
};

export default defineComponent({
  name: 'MenuItem',

  props: {
    item: {
      type: Object as PropType<MenuItem>,
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

<style lang="scss" scoped>
.v-list-item {
  padding-inline-start: 16px;
}
</style>
