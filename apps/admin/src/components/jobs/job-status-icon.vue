<template>
  <v-icon
    v-if="successful === null"
    color="warning"
    icon="fas fa-stopwatch"
    :title="$t('jobs.running', { progress: percent })"
  />
  <v-icon v-else-if="successful" color="success" icon="$check" />
  <v-icon v-else color="error" icon="$times" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({ name: 'JobStatusIcon' });

const props = defineProps<{
  successful: boolean | null;
  progress: number | null;
}>();

const percent = computed(() => Math.floor((props.progress ?? 0) * 100));
</script>
