<template>
  <app-entry-screen
    :subtitle="$t('common.login.subtitle')"
    :title="$t('common._')"
  >
    <div class="d-flex flex-column ga-4 pa-4">
      <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="login">
        <v-card-text class="d-flex flex-column ga-4 px-4">
          <v-text-field
            v-model="email"
            autocomplete="email"
            :error-messages="errors.get('email')"
            :label="$t('common.email')"
            name="email"
            prepend-inner-icon="fas fa-envelope"
            required
          />
          <v-text-field
            v-model="password"
            autocomplete="current-password"
            :error-messages="errors.get('password')"
            :label="$t('common.password._')"
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
          <v-btn
            class="font-weight-bold justify-start"
            color="info"
            :to="{ name: 'password-request' }"
            variant="text"
          >
            {{ $t('common.password.forgot') }}
          </v-btn>
          <v-btn color="primary" :disabled="isAppLoading" rounded size="x-large" type="submit">
            {{ $t('common.login._') }}
          </v-btn>
        </v-card-text>
      </v-form>
      <div v-if="oidcProviders.length" class="d-flex flex-column ga-4 pa-4">
        <div class="d-flex flex-row justify-between align-center text-uppercase font-weight-medium text-body-small">
          <v-divider class="flex-shrink-1" />
          <span class="mx-4 text-body-medium font-weight-medium flex-shrink-0">
            {{ $t('common.oidc._') }}
          </span>
          <v-divider />
        </div>
        <v-row class="justify-center">
          <v-col v-for="provider in oidcProviders" :key="provider" cols="6">
            <v-btn
              block
              color="primary"
              rounded size="x-large"
              variant="outlined"
              @click="oidc(provider)"
            >
              <v-icon start>
                {{ `fab fa-${provider.toLowerCase()}` }}
              </v-icon>
              {{ provider.at(0)?.toUpperCase() + provider.slice(1) }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <div v-if="signupEnabled" class="d-flex flex-column ga-4 pa-4">
        <v-divider />
        <div class="font-weight-medium text-center text-headline-small">
          {{ $t('common.signup.noAccount') }}
        </div>
        <v-card-text>
          <v-btn block color="primary" rounded size="x-large" :to="{ name: 'signup' }" variant="outlined">
            {{ $t('common.signup._') }}
          </v-btn>
        </v-card-text>
      </div>
    </div>
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

const oidcProviders = import.meta.env.VITE_OIDC_PROVIDERS?.split(',') ?? [];

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

async function oidc(provider: string) {
  const { url } = await auth.oidcRedirect(provider);
  window.location.href = url;
}
</script>

<style lang="scss"></style>
