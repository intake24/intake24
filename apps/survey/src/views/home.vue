<template>
  <v-container :class="{ 'pa-0': $vuetify.display.mobile }">
    <app-entry-screen
      :subtitle="$t('common.welcome.subtitle')"
      :title="$t('common._')"
    >
      <v-card-text class="d-flex flex-column ga-4 px-6 pt-0 pb-6">
        <v-divider class="mt-4" />
        <div class="text-h3 font-weight-medium text-center">
          {{ $t('survey.participant._') }}
        </div>
        <div class="text-subtitle-2 text-center font-weight-medium opacity-70">
          {{ $t('survey.participant.subtitle') }}
        </div>
        <v-alert type="info">
          <div v-html="$t('survey.participant.link')" />
        </v-alert>
        <div v-html="$t('survey.participant.info')" />
        <image-placeholder v-if="isLoading" />
        <template v-if="hasDemo">
          <v-divider />
          <div class="text-h3 font-weight-medium text-center">
            {{ $t('survey.visitor._') }}
          </div>
          <div class="text-subtitle-2 text-center font-weight-medium opacity-70">
            {{ $t('survey.visitor.subtitle') }}
          </div>
          <v-btn
            block
            color="accent"
            rounded
            size="x-large"
            :to="{ name: 'survey-generate-user', params: { surveyId: 'demo' } }"
            variant="outlined"
          >
            {{ $t('survey.visitor.try') }}
          </v-btn>
        </template>
      </v-card-text>
    </app-entry-screen>
  </v-container>
</template>

<script lang="ts" setup>
import type { PublicSurveyEntry } from '@intake24/common/types/http';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { ImagePlaceholder } from '@intake24/survey/components/elements';
import { AppEntryScreen } from '@intake24/ui/components';

import { surveyService } from '../services';
import { useAuth, useUser } from '../stores';

defineOptions({
  name: 'AppHome',
});

const auth = useAuth();
const router = useRouter();

const isLoading = ref(false);
const surveys = ref<PublicSurveyEntry[]>([]);
const hasDemo = computed(() => surveys.value.find(({ slug }) => slug === 'demo'));

async function fetchSurveyPublicInfo() {
  isLoading.value = true;

  try {
    surveys.value = await surveyService.surveyPublicList();
  }
  finally {
    isLoading.value = false;
  }
}

async function tryLoggingIn() {
  if (!auth.loggedIn)
    await auth.refresh(false);
  if (!auth.loggedIn)
    return;

  const surveyId = useUser().profile?.surveyId;
  if (!surveyId)
    return;

  await router.push({ name: 'survey-home', params: { surveyId } });
}

onMounted(async () => {
  await tryLoggingIn();
  await fetchSurveyPublicInfo();
});
</script>
