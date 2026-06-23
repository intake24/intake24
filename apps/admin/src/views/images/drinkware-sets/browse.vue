<template>
  <browse-layout>
    <gallery subtitle="description" title="id" />
  </browse-layout>
</template>

<script lang="ts" setup>
import Gallery from '@intake24/admin/components/gallery/gallery.vue';
import { BrowseLayout } from '@intake24/admin/components/layouts';

defineOptions({ name: 'DrinkwareSetList' });
</script>
