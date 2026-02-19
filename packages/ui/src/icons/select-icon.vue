<template>
  <v-dialog v-model="dialog" :disabled="readonly" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-text-field
          v-bind="{
            label: $t('common.icons._'),
            name: 'icon',
            ...$attrs,
            ...props,
            errorMessages,
            modelValue,
          }"
          :prepend-inner-icon="iconSvg"
          readonly
          @click:clear="clear"
        />
      </slot>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('common.icons.select') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-item-group v-model="icon">
        <v-card-text class="d-flex flex-wrap justify-center ga-2">
          <v-item
            v-for="(svg, key) in icons"
            :key="key"
            v-slot="{ isSelected, toggle }"
            :value="key"
          >
            <v-card
              class="pa-2"
              color="primary"
              :variant="isSelected ? 'flat' : 'tonal'"
              @click="update(toggle)"
            >
              <v-icon color="black" :icon="svg" size="100" />
            </v-card>
          </v-item>
        </v-card-text>
      </v-item-group>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { computed, ref } from 'vue';

import { getIcon, icons } from './icons';

defineOptions({
  name: 'SelectIcon',
  inheritAttrs: false,
});

defineProps({
  errorMessages: {
    type: Array as PropType<string[]>,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const icon = defineModel('modelValue', { type: String as PropType<string | null>, default: null });
const iconSvg = computed(() => getIcon(icon.value) ?? 'fas fa-icons');

const dialog = ref(false);

function update(toggle?: () => void) {
  toggle?.();
  close();
}

function clear() {
  icon.value = null;
};

function close() {
  dialog.value = false;
};
</script>

<style lang="scss" scoped>
</style>
