<template>
  <app-entry-screen
    :subtitle="$t('common.login.subtitle')"
    :title="$t('common._')"
  >
    <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="login">
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="email"
                autocomplete="email"
                :error-messages="errors.get('email')"
                hide-details="auto"
                :label="$t('common.email')"
                name="email"
                prepend-inner-icon="fas fa-envelope"
                required
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="password"
                autocomplete="current-password"
                :error-messages="errors.get('password')"
                hide-details="auto"
                :label="$t('common.password._')"
                name="password"
                prepend-inner-icon="fas fa-key"
                required
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
              >
                <template #append-inner>
                  <v-icon class="me-2" @click="showPassword = !showPassword">
                    {{ showPassword ? 'fas fa-eye' : 'fas fa-eye-slash' }}
                  </v-icon>
                </template>
              </v-text-field>
              <v-btn
                class="mt-2 font-weight-bold"
                color="info"
                :to="{ name: 'password-request' }"
                variant="text"
              >
                {{ $t('common.password.forgot') }}
              </v-btn>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="12">
              <v-btn block color="primary" :disabled="isAppLoading" rounded size="x-large" type="submit">
                {{ $t('common.login._') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-form>
    <template v-if="signupEnabled">
      <v-divider class="mx-6" />
      <v-card-title class="text-h3 font-weight-medium text-center pt-6">
        {{ $t('common.signup.noAccount') }}
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row justify="center">
            <v-col cols="12">
              <v-btn block color="primary" rounded size="x-large" :to="{ name: 'signup' }" variant="outlined">
                {{ $t('common.signup._') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </template>
    <mfa-dialog
      v-if="auth.mfa"
      :auth-data="auth.mfa"
      :model-value="!!auth.mfa"
      @close="clearMFAChallenge"
    />
  </app-entry-screen>
</template>

<script lang="ts" setup>
import axios, { HttpStatusCode } from 'axios';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth, useMessages } from '@intake24/admin/stores';
import { Errors } from '@intake24/common/util';
import { AppEntryScreen } from '@intake24/ui';
import MfaDialog from './mfa-dialog.vue';

defineOptions({
  name: 'SignIn',
});

const auth = useAuth();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errors = ref(new Errors());
const signupEnabled = import.meta.env.VITE_ACL_SIGNUP_ENABLED === 'true';

onMounted(async () => {
  // Check for Duo MFA response
  const { state: challengeId, code: token } = route.query;
  if (typeof challengeId !== 'string' || typeof token !== 'string')
    return;

  try {
    await auth.verify({ challengeId, token, provider: 'duo' });
    await finalizeLogin();
  }
  catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === HttpStatusCode.Unauthorized) {
      useMessages().error('Invalid MFA authentication.');
      return;
    }

    throw err;
  }
});

function clearMFAChallenge() {
  auth.mfa = null;
};

async function finalizeLogin() {
  if (!auth.loggedIn)
    return;

  await router.push({ name: 'dashboard' });
};

async function login() {
  try {
    await auth.login({ email: email.value, password: password.value });
    email.value = '';
    password.value = '';

    await finalizeLogin();
  }
  catch (err) {
    if (axios.isAxiosError(err)) {
      const { response: { status, data = {} } = {} } = err;

      if (status === HttpStatusCode.BadRequest && 'errors' in data) {
        errors.value.record(data.errors);
        return;
      }

      if (status === HttpStatusCode.Unauthorized) {
        useMessages().error('Invalid authentication credentials provided.');
        return;
      }
    }

    throw err;
  }
};
</script>

<style lang="scss"></style>
