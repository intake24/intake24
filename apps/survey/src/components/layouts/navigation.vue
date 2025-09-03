<template>
  <v-bottom-navigation
    v-if="mobile"
    id="app-mobile-navigation"
    ref="nav"
    v-model="drawer"
    class="d-print-none bottom-navigation"
    color="primary"
    grow
  >
    <v-btn
      class="order-0"
      :title="$t('common.nav.home')"
      :to="{ name: 'survey-home', params: { surveyId } }"
      value="home"
    >
      <v-icon icon="$home" />
      <span>{{ $t('common.nav.home') }}</span>
    </v-btn>
    <v-btn
      v-if="feedback"
      class="order-1"
      :title="$t('common.nav.feedback')"
      :to="{ name: 'feedback-home', params: { surveyId } }"
      value="feedback"
    >
      <v-icon icon="$feedback" />
      <span>{{ $t('common.nav.feedback') }}</span>
    </v-btn>
    <v-spacer v-else class="order-1" />
    <v-btn
      v-if="recall && $route.name !== 'survey-recall'"
      class="order-2"
      :title="$t('common.nav.recall')"
      :to="{ name: 'survey-recall', params: { surveyId } }"
      value="recall"
    >
      <v-icon icon="$survey" />
      <span>{{ $t('common.nav.recall') }}</span>
    </v-btn>
    <help-nav :survey-id @close="removeActiveState('help')" />
    <v-btn
      class="order-4 nav-item__options"
      :title="$t('common.nav.options')"
      value="options"
      @click="emit('update:modelValue', true)"
    >
      <v-icon icon="fas fa-bars" />
      <span>{{ $t('common.nav.options') }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref, useTemplateRef, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { HelpNav } from '../elements';

defineOptions({ name: 'AppNavigation' });

const props = defineProps({
  modelValue: {
    type: Boolean as PropType<boolean>,
  },
  surveyId: {
    type: String as PropType<string>,
    required: true,
  },
  recall: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  feedback: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { mobile } = useDisplay();

const drawer = ref('home');
const nav = useTemplateRef('nav');

function removeActiveState(item: string) {
  const el = (nav.value?.$el as HTMLElement | null)?.querySelector(`.nav-item__${item}`);
  el?.classList.remove('v-btn--active', 'v-btn--selected', 'text-primary');
}

watch(() => props.modelValue, (val) => {
  if (val)
    return;

  removeActiveState('options');
});
</script>

<style lang="scss" scoped>
.bottom-navigation {
  overflow: unset;
}
</style>
