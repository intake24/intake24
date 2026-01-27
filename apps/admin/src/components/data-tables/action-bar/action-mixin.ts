import type { RouteLocationRaw } from 'vue-router';

import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    action: {
      type: String,
      required: true,
    },
    item: {
      type: Object,
      required: true,
    },
    title: {
      type: String,
    },
  },

  emits: ['action'],

  computed: {
    icon(): string {
      return `$${this.action}`;
    },
    route(): string | null | undefined {
      return this.$route.name?.toString();
    },
    internalTitle(): string {
      return this.title ?? this.$t(`common.action.${this.action}`);
    },
    internalTo(): RouteLocationRaw {
      const {
        action,
        item: { id },
        route,
      } = this;

      return { name: `${route}-${action}`, params: id ? { id } : undefined };
    },
  },

  methods: {
    onClick() {
      this.$emit('action', this.action);
    },
  },
});
