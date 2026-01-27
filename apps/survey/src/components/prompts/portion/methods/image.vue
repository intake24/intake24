<template>
  <v-img :aspect-ratio="3 / 2" cover :src="method.imageUrl">
    <template #placeholder>
      <image-placeholder />
    </template>
  </v-img>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { UserPortionSizeMethod } from '@intake24/common/types/http/foods';

import { defineComponent } from 'vue';

import { ImagePlaceholder } from '@intake24/survey/components/elements';

export default defineComponent({
  name: 'PortionImage',

  components: { ImagePlaceholder },

  props: {
    method: {
      type: Object as PropType<UserPortionSizeMethod>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
