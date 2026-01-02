<template>
  <v-row justify="center" :no-gutters="$vuetify.display.mobile">
    <v-col class="p-4" cols="12" sm="auto">
      <v-card
        :class="{ 'mt-10': $vuetify.display.smAndUp, [contentClass]: contentClass }"
        :flat="$vuetify.display.mobile"
        :tile="$vuetify.display.mobile"
        :width="$vuetify.display.smAndUp ? width : undefined"
      >
        <div class="d-flex justify-center align-center pt-4">
          <slot name="logo">
            <v-avatar v-if="hasIcon" rounded="0">
              <v-img :cover="false" :src="iconFile" />
            </v-avatar>
          </slot>
          <slot name="title">
            <v-card-title class="text-h2 font-weight-medium justify-center">
              {{ title }}
            </v-card-title>
          </slot>
        </div>
        <slot name="subtitle">
          <v-card-subtitle v-if="subtitle" class="text-center font-weight-medium px-6 pt-4 pb-0">
            {{ subtitle }}
          </v-card-subtitle>
        </slot>
        <slot />
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

import { iconPrimary } from '@intake24/common/theme/assets';

export default defineComponent({
  name: 'EntryScreen',

  props: {
    icon: {
      type: [Boolean, String],
      default: true,
    },
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    width: {
      type: String,
      default: '30rem',
    },
    contentClass: {
      type: String,
      default: '',
    },
  },

  setup(props) {
    const hasIcon = computed(() => typeof props.icon === 'string' || props.icon);
    const iconFile = computed(() => (typeof props.icon === 'string' ? props.icon : iconPrimary));

    return {
      hasIcon,
      iconFile,
    };
  },
});
</script>

<style lang="scss"></style>
