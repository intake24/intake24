<template>
  <v-list density="compact" nav :opened="[name]">
    <v-list-group color="grey-lighten-1" :prepend-icon="icon" :value="name">
      <template #activator="{ props }">
        <v-list-item v-bind="props">
          {{ $t(`common.${name}`) }}
        </v-list-item>
      </template>
      <menu-item v-for="item in items" :key="item.name" :item="item" />
    </v-list-group>
  </v-list>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Resource } from '@intake24/admin/types';

import { defineComponent } from 'vue';

import MenuItem from './menu-item.vue';

export default defineComponent({
  name: 'MenuTree',

  components: { MenuItem },

  props: {
    expanded: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    resources: {
      type: Array as PropType<Resource[]>,
      required: true,
    },
  },

  data() {
    return {
      toggle: this.expanded,
    };
  },

  computed: {
    items(): Resource[] {
      return this.resources.filter(item => this.can(item.module ?? item.name));
    },
  },
});
</script>

<style lang="scss" scoped></style>
