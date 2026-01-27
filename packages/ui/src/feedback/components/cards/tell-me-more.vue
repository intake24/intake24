<template>
  <div>
    <v-btn
      block
      class="button-bottom rounded-t-0"
      :class="textColor"
      :color="isWhite ? 'grey-lighten-3' : detail.color"
      size="large"
      variant="flat"
      @click.stop="open"
    >
      {{ $t('feedback.intake.tellMeMore') }}
    </v-btn>
    <v-dialog
      v-model="dialog"
      :fullscreen="$vuetify.display.smAndDown"
      max-width="600px"
      scrollable
    >
      <v-card :tile="$vuetify.display.smAndDown">
        <v-toolbar
          class="font-weight-medium text-h3 tell-me-more-title flex-grow-0"
          color="secondary"
          dark
          flat
        >
          <v-btn icon="$close" :title="$t('common.action.ok')" @click.stop="close" />
          <v-toolbar-title class="ps-2">
            {{ detail.name }}
          </v-toolbar-title>
        </v-toolbar>
        <template v-if="detail.showIntake.includes('description') || detail.unitDescription">
          <v-card-text v-if="detail.showIntake.includes('description')" class="flex-grow-0 flex-shrink-0 pt-4 pb-0">
            <div class="text-subtitle-1">
              <span class="font-weight-medium">{{ $t('feedback.intake.estimated') }}: </span>
              <span :class="detail.textClass">{{ detail.intake }} {{ detail.unit }}</span>
            </div>
            <div v-if="detail.recommendedIntake" class="text-subtitle-1">
              <span class="font-weight-medium">{{ $t('feedback.intake.recommended') }}: </span>
              {{ detail.recommendedIntake.toString() }}
              {{ detail.unit }}
            </div>
          </v-card-text>
          <v-card-text v-if="detail.unitDescription" class="flex-grow-0 flex-shrink-0 pt-4 pb-0">
            <div v-html="detail.unitDescription" />
          </v-card-text>
          <v-divider class="mx-4 mt-2" />
        </template>
        <v-card-text v-if="detail.description" class="pt-4 overflow-y-auto">
          <div v-html="detail.description" />
        </v-card-text>
        <v-btn
          block
          class="button-bottom rounded-t-0 font-weight-bold flex-grow-0 flex-shrink-0"
          :class="{
            'rounded-b-0': $vuetify.display.smAndDown,
          }"
          color="secondary"
          size="large"
          :title="$t('common.action.ok')"
          @click.stop="close"
        >
          <v-icon icon="fas fa-thumbs-up" start />
          {{ $t('feedback.intake.gotIt') }}
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { FeedbackDetails } from './use-card';

import { computed, ref } from 'vue';

const props = defineProps({
  detail: {
    type: Object as PropType<FeedbackDetails>,
    required: true,
  },
  textColor: {
    type: String,
  },
});

const dialog = ref(false);

const isWhite = computed(() => ['#fff', '#ffffff', '#ffffffff'].includes(props.detail.color.toLowerCase()));

function open() {
  dialog.value = true;
}

function close() {
  dialog.value = false;
}
</script>

<style lang="scss" scoped>
.tell-me-more-title {
  letter-spacing: 0.1rem;
}

.button-bottom {
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.075);
  }
}
</style>
