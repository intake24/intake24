<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('fdbs.foods.local.altNames._') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-combobox
        v-model="synonyms"
        chips
        closable-chips
        hide-details="auto"
        :label="$t('fdbs.foods.local.altNames.synonyms')"
        multiple
        name="altNames"
        variant="outlined"
      />
      <!-- Copyable text display -->
      <div v-if="synonyms.length" class="synonym-list">
        <span
          v-for="(synonym, index) in synonyms"
          :key="index"
          class="synonym-item"
          :title="$t('common.action.copy')"
          @click="copySynonym(synonym)"
        >{{ synonym }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';

import { useMessages } from '@intake24/ui/stores';

export default defineComponent({
  name: 'AltNamesList',

  props: {
    modelValue: {
      type: Object as PropType<Record<string, string[]>>,
      default: () => ({}),
    },
    languageCode: {
      type: String,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const synonyms = computed({
      get: () => props.modelValue[props.languageCode] ?? [],
      set: (value: string[]) => {
        emit('update:modelValue', { [props.languageCode]: value });
      },
    });

    const copySynonym = async (text: string) => {
      await navigator.clipboard.writeText(text);
      useMessages().info(`Copied: ${text}`);
    };

    return {
      synonyms,
      copySynonym,
    };
  },
});
</script>

<style lang="scss" scoped>
.synonym-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.synonym-item {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: #1a1a2e;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: text;

  &:hover {
    background: #e3f2fd;
    border-color: #90caf9;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &:active {
    background: #bbdefb;
    transform: scale(0.98);
  }
}
</style>
