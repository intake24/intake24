<template>
  <browse-layout>
    <gallery
      :actions="[]"
      image-url="sizes.sm"
      subtitle="filename"
      title="name"
    />
  </browse-layout>
</template>

<script lang="ts" setup>
import Gallery from '@intake24/admin/components/gallery/gallery.vue';
import { BrowseLayout } from '@intake24/admin/components/layouts';

defineOptions({ name: 'MediaList' });
</script>
