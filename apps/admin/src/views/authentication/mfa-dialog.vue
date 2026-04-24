<template>
  <v-dialog v-bind="{ modelValue }" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>{{ $t('common.mfa.title') }}</v-toolbar-title>
      </v-toolbar>
      <v-row no-gutters>
        <v-col ref="input" cols="12" md="6">
          <v-sheet color="grey-lighten-3 d-flex justify-center align-center pa-4 pa-md-6 h-100">
            <div v-if="provider === 'duo'" class="d-flex flex-column align-center">
              <v-progress-circular
                class="mb-4"
                color="primary"
                :model-value="duo.value"
                :rotate="-90"
                :size="200"
                :width="20"
              >
                <div class="d-flex align-center flex-column">
                  <v-icon class="mb-2 ml-2" color="secondary" icon="$duo" size="80" />
                  <span class="font-weight-bold text-h4">{{ duo.value / 20 }} </span>
                </div>
              </v-progress-circular>
              <v-btn block color="secondary" rounded @click="duoChallenge">
                {{ $t('common.action.redirect') }}
              </v-btn>
            </div>
            <div
              v-if="provider === 'fido'"
              class="d-flex flex-column align-center"
              @click="fidoChallenge"
            >
              <v-icon class="mb-6" color="secondary" icon="$fido" size="80" />
              <v-btn block color="secondary" rounded @click="fidoChallenge">
                {{ $t('common.action.retry') }}
              </v-btn>
            </div>
            <v-form
              v-if="provider === 'otp'"
              autocomplete="off"
              class="w-100"
              @submit.prevent="otpChallenge"
            >
              <div class="d-flex flex-column align-center ga-4">
                <v-icon color="secondary" icon="$otp" size="80" />
                <p class="text-subtitle-1">
                  {{ $t('common.mfa.otp') }}
                </p>
                <v-otp-input
                  v-model="otp.data.value.token"
                  autocomplete="off"
                  color="white"
                  :error-messages="otp.errors.get('token')"
                  length="6"
                  name="token"
                  @update:model-value="otp.errors.clear('token')"
                />
                <v-btn block color="secondary" rounded type="submit">
                  {{ $t('common.action.confirm._') }}
                </v-btn>
              </div>
            </v-form>
            <v-form
              v-if="provider === 'code'"
              autocomplete="off"
              class="w-100"
              @submit.prevent="codeChallenge"
            >
              <div class="d-flex flex-column align-center ga-4">
                <v-icon color="secondary" icon="$code" size="80" />
                <p class="text-subtitle-1">
                  {{ $t('common.mfa.code') }}
                </p>
                <v-text-field
                  v-model="code.data.value.token"
                  autocomplete="off"
                  class="w-100 bg-white"
                  :error-messages="code.errors.get('token')"
                  name="token"
                  variant="outlined"
                  @update:model-value="code.errors.clear('token')"
                />
                <v-btn block color="secondary" rounded type="submit">
                  {{ $t('common.action.confirm._') }}
                </v-btn>
              </div>
            </v-form>
          </v-sheet>
        </v-col>
        <v-col
          class="overflow-auto"
          cols="12"
          md="6"
          :style="{ height: $vuetify.display.smAndDown ? 'auto' : `${height}px` }"
        >
          <v-list
            v-model:selected="deviceId"
            class="list-border"
            lines="two"
            @update:selected="selectDevice"
          >
            <v-list-subheader>{{ $t('common.mfa.devices') }}</v-list-subheader>
            <v-list-item v-for="device in authData.devices" :key="device.id" link :value="device.id">
              <template #prepend>
                <v-icon :title="$t(`user.mfa.providers.${device.provider}._`)">
                  {{ `$${device.provider}` }}
                </v-icon>
              </template>
              <v-list-item-title>{{ device.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ $t(`user.mfa.providers.${device.provider}.title`) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { LoginResponse, MFAChallengeResponse } from '@intake24/common/types/http';

import { startAuthentication } from '@simplewebauthn/browser';
import { useElementSize } from '@vueuse/core';
import { HttpStatusCode, isAxiosError } from 'axios';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useForm } from '@intake24/admin/composables';
import { useAuth, useMessages } from '@intake24/admin/stores';
import { useI18n } from '@intake24/ui';

const props = defineProps({
  authData: {
    type: Object as PropType<MFAChallengeResponse>,
    required: true,
  },
  modelValue: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(['close', 'confirm']);

const auth = useAuth();
const router = useRouter();
const { i18n: { t } } = useI18n();

const input = useTemplateRef('input');
const { height } = useElementSize(input);

const deviceId = ref(props.authData.challenge?.deviceId ? [props.authData.challenge?.deviceId] : []);
const otp = useForm({ data: { challengeId: '', provider: 'otp', token: '' } });
const code = useForm({ data: { challengeId: '', provider: 'code', token: '' } });
const duo = ref({
  interval: undefined as undefined | number,
  value: 100,
});

const provider = computed(() => props.authData.challenge?.provider);
const challengeId = computed(() => props.authData.challenge?.challengeId);

function close() {
  emit('close');
};

function fail() {
  useMessages().error(t('common.mfa.error'));
  close();
};

function clearDuoInterval() {
  duo.value.value = 100;
  clearInterval(duo.value.interval);
};

async function selectDevice(devices: string[]) {
  const deviceId = devices.at(0);
  if (!deviceId || !props.authData.challenge)
    return;

  const device = props.authData.devices.find(d => d.id === deviceId);
  if (!device)
    return;

  const { challengeId } = props.authData.challenge;
  const { userId } = device;

  await auth.challenge({ deviceId, challengeId, userId });
};

async function duoTimeoutChallenge() {
  // @ts-expect-error - node types
  duo.value.interval = setInterval(() => {
    duo.value.value -= 20;

    if (duo.value.value === 0) {
      clearDuoInterval();
      duoChallenge();
    }
  }, 1000);
};

async function duoChallenge() {
  if (props.authData.challenge?.provider !== 'duo')
    throw new Error('Invalid MFA provider');

  clearDuoInterval();
  window.location.href = props.authData.challenge.challengeUrl;
};

async function fidoChallenge() {
  if (props.authData.challenge?.provider !== 'fido')
    throw new Error('Invalid MFA provider');

  try {
    const { challengeId, provider, options } = props.authData.challenge;
    const response = await startAuthentication({ optionsJSON: options });
    await auth.verify({ challengeId, provider, response });
    await finalizeLogin();
  }
  catch {
    useMessages().error(t('common.mfa.error'));
  }
};

async function codeChallenge() {
  if (props.authData.challenge?.provider !== 'code')
    throw new Error('Invalid MFA provider');

  const { challengeId, provider } = props.authData.challenge;

  code.data.value.challengeId = challengeId;
  code.data.value.provider = provider;

  try {
    const { accessToken } = await code.post<LoginResponse>('admin/auth/verify', { withLoading: true });
    await auth.successfulLogin(accessToken);
    await finalizeLogin();
  }
  catch (err) {
    if (isAxiosError(err) && err.response?.status !== HttpStatusCode.BadRequest)
      fail();
  }
};

async function otpChallenge() {
  if (props.authData.challenge?.provider !== 'otp')
    throw new Error('Invalid MFA provider');

  const { challengeId, provider } = props.authData.challenge;

  otp.data.value.challengeId = challengeId;
  otp.data.value.provider = provider;

  try {
    const { accessToken } = await otp.post<LoginResponse>('admin/auth/verify', { withLoading: true });
    await auth.successfulLogin(accessToken);
    await finalizeLogin();
  }
  catch (err) {
    if (isAxiosError(err) && err.response?.status !== HttpStatusCode.BadRequest)
      fail();
  }
};

async function finalizeLogin() {
  if (!auth.loggedIn)
    return;

  await router.push({ name: 'dashboard' });
};

async function initializeChallenge() {
  if (!props.authData.challenge)
    return;

  const { provider } = props.authData.challenge;

  if (provider === 'duo') {
    await duoTimeoutChallenge();
    return;
  }

  if (provider === 'fido')
    await fidoChallenge();
};

onBeforeUnmount(() => {
  clearDuoInterval();
});

watch(() => props.modelValue, async (val, oldVal) => {
  if (!val || oldVal || !props.authData.challenge)
    return;

  await initializeChallenge();
}, { immediate: true });

watch(challengeId, async () => {
  await initializeChallenge();
});
</script>

<style lang="scss">
</style>
