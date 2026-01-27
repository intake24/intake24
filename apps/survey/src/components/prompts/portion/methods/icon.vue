<template>
  <v-responsive :aspect-ratio="3 / 2">
    <div class="d-flex justify-center align-center h-100">
      <v-icon color="primary" :icon="icon" size="120" />
    </div>
  </v-responsive>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { UserPortionSizeMethod } from '@intake24/common/types/http/foods';

import { computed } from 'vue';

defineOptions({ name: 'PortionIcon' });

defineProps({
  method: {
    type: Object as PropType<UserPortionSizeMethod>,
    required: true,
  },
});

const icon = computed(() => 'far fa-question-circle');
</script>

<style lang="scss" scoped></style>
