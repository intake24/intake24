<template>
  <v-card border class="ma-2 pa-4" flat rounded="xl">
    <slot />
  </v-card>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SimpleLayout' });
</script>

<style lang="scss">
</style>
