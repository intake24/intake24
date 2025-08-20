<template>
  <gallery
    :actions="[]"
    image-url="sizes.sm"
    subtitle="filename"
    title="name"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Gallery from '@intake24/admin/components/gallery/gallery.vue';

export default defineComponent({
  name: 'MediaList',

  components: { Gallery },
});
</script>
