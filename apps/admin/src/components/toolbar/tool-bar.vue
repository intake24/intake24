<template>
  <v-card
    v-if="currentActions.length" class="mb-5 px-2"
    :flat="$vuetify.display.mobile"
    :rounded="$vuetify.display.mobile ? 0 : undefined"
  >
    <v-toolbar class="toolbar-items" color="white">
      <template v-for="action in ['create', 'read', 'edit']" :key="action">
        <component
          :is="action"
          v-if="currentActions.includes(action)"
          :action="action"
          :disabled="selected.length !== 1"
          @action="onAction"
        />
      </template>
      <v-spacer />
      <confirm-dialog
        v-if="currentActions.includes('delete')"
        color="error"
        :disabled="!selected.length"
        icon-left="$delete"
        :label="$t('common.action.delete')"
        variant="flat"
        @confirm="onDelete"
      >
        {{ $t('common.action.confirm.multi.delete', { count: selected.length }) }}
      </confirm-dialog>
    </v-toolbar>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import { upperFirst } from 'lodash-es';
import { defineComponent } from 'vue';

import { ConfirmDialog } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

import Create from './create.vue';
import Edit from './edit.vue';
import Read from './read.vue';

export default defineComponent({
  name: 'ToolBar',

  components: {
    ConfirmDialog,
    Create,
    Read,
    Edit,
  },

  props: {
    actions: {
      type: Array as PropType<string[]>,
      default: () => ['create', 'read', 'edit', 'delete'],
    },
    selected: {
      type: Array as PropType<(number | string)[]>,
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
      return this.actions.filter(action => this.can({ action }));
    },
    route() {
      return this.$route.name?.toString() ?? this.module;
    },
  },

  methods: {
    async onAction(action: string) {
      // @ts-expect-error types
      await this[`on${upperFirst(action)}`]();
    },

    async onRead() {
      const id = this.getOneSelected();
      if (!id)
        return;

      await this.$router.push({ name: `${this.route}-read`, params: { id } });
    },

    async onEdit() {
      const id = this.getOneSelected();
      if (!id)
        return;

      await this.$router.push({ name: `${this.route}-edit`, params: { id } });
    },

    async onDelete() {
      const id = this.getAtLeastOneSelected();
      if (!id)
        return;

      await this.$http.delete(this.api, { params: { id } });
      useMessages().success(this.$t('common.msg.multi.deleted'));
      this.onDraw();
    },

    getOneSelected() {
      if (this.selected.length !== 1) {
        useMessages().info(this.$t('Select one item to view/edit details.'));
        return false;
      }
      return this.selected[0];
    },

    getAtLeastOneSelected() {
      if (!this.selected.length) {
        useMessages().info(this.$t('Select at least one item.'));
        return false;
      }
      return this.selected;
    },

    onDraw() {
      this.$emit('refresh');
    },
  },
});
</script>

<style lang="scss" scoped></style>
