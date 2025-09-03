<template>
  <slot v-bind="{ to }">
    <v-btn
      v-if="mobile"
      class="order-3 nav-item__help"
      :to
      value="help"
    >
      <v-icon icon="$info" />
      <span>{{ $t('common.help._') }}</span>
    </v-btn>
    <v-btn
      v-else
      color="grey"
      :title="$t('common.faqs.title')"
      :to
      variant="flat"
    >
      <v-icon icon="$info" start />
      {{ $t('common.faqs._') }}
    </v-btn>
  </slot>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';

const props = defineProps({
  surveyId: {
    type: String,
    required: true,
  },
});

const { mobile } = useDisplay();
const to = { name: 'faqs', params: { surveyId: props.surveyId } };
</script>
