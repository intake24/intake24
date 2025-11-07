<template>
  <template v-if="!!request && !!faqs">
    <v-btn
      v-if="!$vuetify.display.mobile"
      class="menu__activator"
      color="grey"
      :title="$t('common.help.request.title')"
      variant="flat"
    >
      <v-icon icon="$info" start />
      {{ $t('common.help._') }}
    </v-btn>
    <v-btn
      v-else
      class="order-3 nav-item__help"
      value="help"
      @click="toggleDrawer"
    >
      <v-icon icon="$info" />
      <span>{{ $t('common.nav.help') }}</span>
    </v-btn>
  </template>
  <help-request
    v-else-if="!!request"
    :settings="request"
    :survey-id
    @close="close"
  />
  <help-faq
    v-else-if="!!faqs"
    :survey-id
    @close="close"
  />
  <v-spacer v-else class="order-3" />
  <component
    :is="$vuetify.display.mobile ? 'v-bottom-sheet' : 'v-menu'"
    v-model="drawer"
    activator=".menu__activator"
    :close-on-content-click="true"
    location="bottom right"
    :persistent="false"
  >
    <v-list>
      <help-faq
        v-if="!!faqs"
        :survey-id
        @close="close"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" prepend-icon="far fa-circle-question">
            <v-list-item-title>{{ $t('common.help.faqs.title') }}</v-list-item-title>
          </v-list-item>
        </template>
      </help-faq>
      <help-request
        v-if="!!request"
        :settings="request"
        :survey-id
        @close="close"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" prepend-icon="fas fa-hand">
            <v-list-item-title>{{ $t('common.help.request.title') }}</v-list-item-title>
          </v-list-item>
        </template>
      </help-request>
    </v-list>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { VBottomSheet, VMenu } from 'vuetify/components';
import { useSurvey } from '@intake24/survey/stores';
import HelpFaq from './help-faq.vue';
import HelpRequest from './help-request.vue';

defineOptions({
  name: 'HelpNavigation',
  components: { VMenu, VBottomSheet },
});

defineProps({
  surveyId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['open', 'close']);

const survey = useSurvey();

const drawer = ref(false);

function close() {
  drawer.value = false;
}

function toggleDrawer() {
  drawer.value = !drawer.value;
}

const faqs = computed(() => survey.parameters?.faqs);
const request = computed(() => survey.parameters?.surveyScheme.settings.help);

watch(drawer, (val) => {
  emit(val ? 'open' : 'close');
});
</script>
