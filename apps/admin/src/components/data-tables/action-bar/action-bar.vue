<template>
  <component
    :is="action"
    v-for="action in currentActions"
    :key="`${action}-${item.id}`"
    :action="action"
    :item="item"
    @action="onAction"
  />
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { upperFirst } from 'lodash-es';
import { defineComponent } from 'vue';

import { useMessages } from '@intake24/admin/stores';

import Delete from './delete.vue';
import Download from './download.vue';
import Edit from './edit.vue';
import Read from './read.vue';

export default defineComponent({
  name: 'ActionBar',

  components: {
    Delete,
    Read,
    Download,
    Edit,
  },

  props: {
    actions: {
      type: Array as PropType<string[]>,
      default: () => ['read', 'edit', 'delete'],
    },
    item: {
      type: Object,
      required: true,
    },
    api: {
      type: String,
      required: true,
    },
  },

  emits: ['refresh'],

  computed: {
    currentActions(): string[] {
      const { ownerId, securables } = this.item;
      return this.actions.filter((item) => {
        const action = item === 'download' ? 'read' : item;

        return this.can({ action, ownerId, securables });
      });
    },
  },

  methods: {
    async onAction(action: string): Promise<void> {
      // @ts-expect-error types
      await this[`on${upperFirst(action)}`]();
    },

    async onDelete(): Promise<void> {
      const { id } = this.item;

      await this.$http.delete(`${this.api}/${id}`);
      this.onSuccess('deleted');
    },

    async onSuccess(action: string): Promise<void> {
      const { id, name } = this.item;
      useMessages().success(this.$t(`common.msg.${action}`, { name: name ?? id }));
      this.$emit('refresh');
    },
  },
});
</script>

<style lang="scss" scoped></style>
