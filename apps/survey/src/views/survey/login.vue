<template>
  <v-container :class="{ 'pa-0': $vuetify.display.mobile }">
    <app-entry-screen content-class="login-screen" :title="$t('common._')">
      <template #subtitle>
        <div class="text-h6 text-center font-weight-medium py-4">
          {{ survey?.name }}
        </div>
      </template>
      <v-divider />
      <v-form v-if="survey?.authModes.includes('username')" @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
        <div class="d-flex align-center gc-4 pt-4">
          <div class="triangle" />
          <div class="text-subtitle2 font-weight-medium">
            {{ $t('common.login.username._') }}
          </div>
        </div>
        <div class="pa-6 pa-md-8 d-flex flex-column ga-6">
          <v-text-field
            v-model="username"
            autocomplete="username"
            :error-messages="errors.get('username')"
            hide-details="auto"
            :label="$t('common.username')"
            name="username"
            prepend-inner-icon="fas fa-user"
            required
          />
          <v-text-field
            v-model="password"
            autocomplete="current-password"
            :error-messages="errors.get('password')"
            hide-details="auto"
            :label="$t('common.password')"
            name="password"
            prepend-inner-icon="fas fa-key"
            required
            :type="showPassword ? 'text' : 'password'"
          >
            <template #append-inner>
              <v-icon class="me-2" @click="showPassword = !showPassword">
                {{ showPassword ? 'fas fa-eye' : 'fas fa-eye-slash' }}
              </v-icon>
            </template>
          </v-text-field>
          <v-btn block color="primary" rounded size="x-large" type="submit">
            {{ $t('common.login._') }}
          </v-btn>
        </div>
        <captcha
          v-if="survey?.authCaptcha"
          ref="captchaEl"
          @expired="expired"
          @verified="verified"
        />
      </v-form>
      <v-divider v-if="(survey?.authModes.length ?? 0) > 1" />
      <div v-if="survey?.authModes.includes('token')">
        <div class="d-flex align-center gc-4 pt-4">
          <div class="triangle" />
          <div class="text-subtitle2 font-weight-medium">
            {{ $t('common.login.token._') }}
          </div>
        </div>
        <div class="pa-6 pa-md-8 d-flex flex-column ga-6">
          <v-alert icon="fas fa-link" type="info">
            {{ $t('common.login.token.subtitle') }}
          </v-alert>
        </div>
      </div>
      <template v-if="isOpenAccess">
        <v-divider />
        <v-card-text class="d-flex flex-column ga-4 pa-6">
          <div class="text-h3 font-weight-medium text-center">
            {{ $t('survey.generateUser.noAccount') }}
          </div>
          <v-card-subtitle class="text-center font-weight-medium">
            {{ $t('survey.generateUser.subtitle') }}
          </v-card-subtitle>
          <v-btn
            block
            color="accent"
            rounded
            size="x-large"
            :to="{ name: 'survey-generate-user', params: { surveyId } }"
            variant="outlined"
          >
            {{ $t('survey.generateUser._') }}
          </v-btn>
        </v-card-text>
      </template>
    </app-entry-screen>
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@intake24/survey/stores';
import { sendGtmEvent } from '@intake24/survey/util';
import { AppEntryScreen, Captcha } from '@intake24/ui';

import { useLogin } from './use-login';

defineOptions({
  name: 'SurveyLogin',
});

const props = defineProps({
  surveyId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const {
  captchaEl,
  captchaToken,
  errors,
  fetchSurveyPublicInfo,
  isOpenAccess,
  login,
  password,
  resetCaptcha,
  showPassword,
  survey,
  username,
} = useLogin(props);

async function verified(token?: string) {
  captchaToken.value = token;
  await login('alias');
}

function expired() {
  resetCaptcha();
}

async function submit() {
  if (captchaEl.value) {
    captchaEl.value.executeIfCan();
    return;
  }

  await login('alias');
}

onMounted(async () => {
  sendGtmEvent({
    event: 'surveyLogin',
    scheme_prompts: 'preMeals',
  });
  await fetchSurveyPublicInfo();
  if (!survey.value) {
    await router.push({ name: 'home' });
    return;
  }

  const auth = useAuth();

  if (!auth.loggedIn) {
    try {
      await auth.refresh();
      await router.push({ name: 'survey-home', params: { surveyId: props.surveyId } });
    }
    catch {
      // continue
    }
  }
});
</script>

<style lang="scss">
.login-screen {
  border-left: 1px solid rgb(var(--v-theme-primary));

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0px;
    height: 0px;
    border-style: solid;
    border-width: 40px 40px 0 0;
    border-color: rgb(var(--v-theme-primary)) transparent transparent transparent;
    transform: rotate(0deg);
  }

  .triangle {
    width: 0px;
    height: 0px;
    border-style: solid;
    border-width: 20px 0 20px 40px;
    border-color: transparent transparent transparent rgb(var(--v-theme-primary));
    transform: rotate(0deg);
  }
}
</style>
