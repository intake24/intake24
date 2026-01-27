<template>
  <component :is="tag" v-if="errors.length">
    <v-alert v-for="(item, idx) in items" :key="idx" class="my-2" density="compact" type="error">
      {{ item }}
    </v-alert>
  </component>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { ValidationError } from '@intake24/common/util';

import { computed, defineComponent } from 'vue';
import { VCardText } from 'vuetify/components';

export default defineComponent({
  name: 'ErrorList',

  components: { VCardText },

  props: {
    errors: {
      type: Array as PropType<ValidationError[] | string[]>,
      required: true,
    },
    tag: {
      type: String,
      default: 'div',
    },
  },

  setup(props) {
    const items = computed(() => props.errors.map(error => typeof error === 'string' ? error : error.msg));

    return { items };
  },
});
</script>

<style lang="scss" scoped></style>
