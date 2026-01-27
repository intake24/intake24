<template>
  <v-stepper-vertical v-model="progress" flat hide-actions>
    <template #default="{ step }">
      <v-stepper-vertical-item :complete="step > 1" :title="$t('user.mfa.devices.init.title')" value="1">
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
              {{ $t('user.mfa.devices.init._') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item :complete="step > 2" :title="$t('user.mfa.devices.qr.title')" value="2">
        <v-row>
          <v-col cols="12" order="last" order-sm="first" sm="6">
            <v-form @submit.prevent="verify">
              <v-text-field
                v-model="data.name"
                class="my-2"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('user.mfa.devices.name._')"
                name="name"
                variant="outlined"
                @update:model-value="errors.clear('name')"
              />
              <p class="my-2 text-subtitle-2">
                {{ $t('user.mfa.devices.qr.text') }}
              </p>
              <v-otp-input
                v-model="data.token"
                :error-messages="errors.get('token')"
                hide-details="auto"
                length="6"
                name="token"
                @input="errors.clear('token')"
              />
              <v-btn block class="my-4" color="secondary" rounded type="submit">
                {{ $t('user.mfa.devices.verify') }}
              </v-btn>
            </v-form>
          </v-col>
          <v-col cols="12" order="first" order-sm="last" sm="6">
            <v-img v-if="regChallenge" :aspect-ratio="1 / 1" :src="regChallenge?.qrCode" />
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item :complete="step >= 3" :title="$t('user.mfa.devices.registered')" value="3" />
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

const emit = defineEmits(['registered']);

const http = useHttp();

const url = 'admin/user/mfa/providers/otp';
const progress = ref(1);
const { data, errors, post, reset } = useForm({ data: { challengeId: '', name: 'My OTP device', token: '' } });

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
