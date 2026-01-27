<template>
  <v-expand-transition>
    <v-card v-show="modelValue" ref="card" border color="grey-lighten-4">
      <v-card-text>
        <div v-html="i18n['missing.description']" />
      </v-card-text>
      <v-card-text class="pt-0 d-flex flex-column flex-md-row ga-3">
        <v-btn
          color="primary"
          size="large"
          :title="i18n['missing.tryAgain']"
          variant="outlined"
          @click.stop="cancel"
        >
          <v-icon icon="fas fa-repeat" start />
          {{ i18n['missing.tryAgain'] }}
        </v-btn>
        <v-btn
          class="btn-truncate"
          color="primary"
          size="large"
          :title="i18n['missing.report']"
          variant="outlined"
          @click.stop="confirm"
        >
          <v-icon icon="fas fa-flag" start />
          {{ i18n['missing.report'] }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-expand-transition>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { useTemplateRef, watch } from 'vue';
import { useGoTo } from 'vuetify';

defineOptions({
  name: 'MissingFoodPanel',
});

const props = defineProps({
  i18n: {
    type: Object as PropType<Record<string, string>>,
    required: true,
  },
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['cancel', 'confirm', 'update:modelValue']);

const goTo = useGoTo();
const card = useTemplateRef('card');

function cancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

async function confirm() {
  emit('confirm');
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value)
      return;

    setTimeout(async () => {
      if (!card.value)
        return;

      await goTo(card.value, { duration: 500 });
    }, 100);
  },
);
</script>

<style lang="scss" scoped></style>
