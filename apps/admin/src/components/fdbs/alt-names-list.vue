<template>
  <language-selector
    v-model="internalValue"
    border
    :default="[]"
    flat
    :label="$t('fdbs.foods.local.altNames._')"
  >
    <template v-for="lang in Object.keys(internalValue)" :key="lang" #[`lang.${lang}`]>
      <v-combobox
        v-model="internalValue[lang]"
        chips
        closable-chips
        hide-details="auto"
        :label="$t('fdbs.foods.local.altNames.synonyms')"
        multiple
        name="altNames"
        variant="outlined"
        @update:model-value="emitUpdate"
      />
    </template>
  </language-selector>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, ref, watch } from 'vue';

import { LanguageSelector } from '@intake24/admin/components/forms';

export default defineComponent({
  name: 'AltNamesList',

  components: { LanguageSelector },

  props: {
    modelValue: {
      type: Object as PropType<Record<string, string[]>>,
      default: () => ({}),
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    // Create a local copy to allow modification
    const internalValue = ref<Record<string, string[]>>({ ...props.modelValue });

    // Watch for external changes
    watch(
      () => props.modelValue,
      (newValue) => {
        internalValue.value = { ...newValue };
      },
      { deep: true },
    );

    // Emit updates
    const emitUpdate = () => {
      emit('update:modelValue', { ...internalValue.value });
    };

    // Watch for internal changes (from LanguageSelector add/remove)
    watch(
      internalValue,
      () => {
        emitUpdate();
      },
      { deep: true },
    );

    return {
      internalValue,
      emitUpdate,
    };
  },
});
</script>

<style lang="scss" scoped>
/* Make chip text selectable for copy-paste */
:deep(.v-chip) {
  user-select: text;
  cursor: text;

  .v-chip__content {
    user-select: text;
  }
}
</style>
