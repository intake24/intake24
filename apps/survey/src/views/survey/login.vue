<template>
  <v-container :class="{ 'pa-0': $vuetify.display.mobile }">
    <app-entry-screen :title="$t('common._')">
      <template #subtitle>
        <div class="text-h6 text-center font-weight-medium pt-4 pb-2">
          {{ survey?.name }}
        </div>
        <v-card-subtitle class="text-center font-weight-medium">
          {{ $t('common.login.subtitle') }}
        </v-card-subtitle>
      </template>
      <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
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
              </v-col>
              <v-col cols="12">
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
              </v-col>
            </v-row>
            <v-row justify="center">
              <v-col cols="12">
                <v-btn block color="primary" rounded size="x-large" type="submit">
                  {{ $t('common.login._') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <captcha
          v-if="survey?.authCaptcha"
          ref="captchaEl"
          @expired="expired"
          @verified="verified"
        />
      </v-form>
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

<style lang="scss"></style>
