<template>
  <v-container :class="{ 'pa-0': $vuetify.display.mobile }">
    <app-entry-screen
      :subtitle="$t('common.login.captcha')"
      :title="$t('common._')"
    >
      <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
        <v-card-text class="d-flex flex-column justify-center align-center">
          <v-icon class="pt-8 pb-12" size="96">
            fas fa-robot
          </v-icon>
          <v-btn block color="primary" rounded size="x-large" type="submit">
            {{ $t('common.login.start') }}
          </v-btn>
        </v-card-text>
        <captcha ref="captchaEl" @expired="expired" @verified="verified" />
      </v-form>
    </app-entry-screen>
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AppEntryScreen, Captcha } from '@intake24/ui';

import { useLogin } from './use-login';

defineOptions({ name: 'SurveyChallenge' });

const props = defineProps({
  surveyId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const route = useRoute();

const {
  captchaEl,
  captchaToken,
  errors,
  login,
  resetCaptcha,
  token,
} = useLogin(props);

async function verified(token?: string) {
  captchaToken.value = token;
  await login('token');
}

function expired() {
  resetCaptcha();
}

async function submit() {
  if (captchaEl.value) {
    captchaEl.value.executeIfCan();
    return;
  }

  await login('token');
}

onMounted(async () => {
  const { auth } = route.query;
  if (!auth || typeof auth !== 'string') {
    await router.push({
      name: 'survey-login',
      params: { surveyId: props.surveyId },
    });
    return;
  }
  token.value = auth;
});
</script>

<style lang="scss"></style>
