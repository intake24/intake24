<template>
  <v-stepper-vertical v-model="progress" flat hide-actions>
    <template #default="{ step }">
      <v-stepper-vertical-item :complete="step > 1" :title="$t('user.mfa.providers.otp.challenge.title')" value="1">
        <v-row>
          <v-col cols="12" sm="6">
            <v-btn
              block
              class="my-4"
              color="secondary"
              :loading="!!regChallenge"
              rounded
              @click="challenge"
            >
              {{ $t('user.mfa.providers.otp.challenge._') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item :complete="step > 2" :title="$t('user.mfa.providers.otp.verify.title')" value="2">
        <v-row>
          <v-col class="order-last order-sm-first" cols="12" sm="6">
            <v-form @submit.prevent="verify">
              <p class="mb-4 text-title-small">
                {{ $t('user.mfa.providers.otp.verify.text') }}
              </p>
              <v-text-field
                v-model="data.name"
                class="mb-4"
                :error-messages="errors.get('name')"
                :label="$t('user.mfa.devices.name._')"
                name="name"
                @update:model-value="errors.clear('name')"
              />
              <v-otp-input
                v-model="data.token"
                :error-messages="errors.get('token')"
                length="6"
                name="token"
                @update:model-value="errors.clear('token')"
              />
              <v-btn
                block
                class="my-4"
                color="secondary"
                :disabled="data.token.length !== 6"
                rounded
                type="submit"
              >
                {{ $t('user.mfa.providers.otp.verify._') }}
              </v-btn>
            </v-form>
          </v-col>
          <v-col class="order-first order-sm-last" cols="12" sm="6">
            <v-img v-if="regChallenge" :aspect-ratio="1 / 1" :src="regChallenge?.qrCode" />
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item
        :complete="step >= 3"
        :title="$t('user.mfa.providers.code.finalize.title')"
        value="3"
      >
        <div class="d-flex flex-column ga-4">
          <div>
            {{ $t('user.mfa.providers.code.finalize.text') }}
          </div>
          <v-btn class="align-self-end" color="info" rounded variant="text" @click="emit('close')">
            {{ $t('common.action.close') }}
          </v-btn>
        </div>
      </v-stepper-vertical-item>
    </template>
  </v-stepper-vertical>
</template>

<script lang="ts" setup>
import type {
  MFADeviceResponse,
  OTPRegistrationChallenge,
} from '@intake24/common/types/http/admin';

import { ref } from 'vue';

import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';

defineOptions({ name: 'OtpDevice' });

const emit = defineEmits(['close', 'registered']);

const http = useHttp();

const url = 'admin/user/mfa/providers/otp';
const progress = ref(1);
const { data, errors, post, reset } = useForm({ data: { challengeId: '', name: 'OTP device', token: '' } });

const regChallenge = ref<OTPRegistrationChallenge | null>(null);

function clear() {
  reset();
  regChallenge.value = null;
  progress.value = 1;
};

async function challenge() {
  const res = await http.get<OTPRegistrationChallenge>(url);

  regChallenge.value = res.data;
  data.value.challengeId = res.data.challengeId;

  progress.value = 2;
};

async function verify() {
  const device = await post<MFADeviceResponse>(url);
  emit('registered', device);

  progress.value = 3;
};

defineExpose({ clear });
</script>
