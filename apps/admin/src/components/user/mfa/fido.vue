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
      <v-stepper-vertical-item :complete="step > 2" :title="$t('user.mfa.devices.name.title')" value="2">
        <v-container>
          <v-row>
            <v-col cols="12" sm="8">
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
                <v-btn block class="my-4" color="secondary" rounded type="submit">
                  {{ $t('user.mfa.devices.verify') }}
                </v-btn>
              </v-form>
            </v-col>
          </v-row>
        </v-container>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item :complete="step >= 3" :title="$t('user.mfa.devices.registered')" value="3" />
    </template>
  </v-stepper-vertical>
</template>

<script lang="ts" setup>
import type {
  FIDORegistrationChallenge,
  FIDORegistrationVerificationRequest,
  MFADeviceResponse,
} from '@intake24/common/types/http/admin';

import { startRegistration } from '@simplewebauthn/browser';
import { ref } from 'vue';

import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';

export interface FIDOForm extends Omit<FIDORegistrationVerificationRequest, 'response'> {
  response: FIDORegistrationVerificationRequest['response'] | null;
}

defineOptions({ name: 'FidoDevice' });

const emit = defineEmits(['registered']);

const http = useHttp();

const url = 'admin/user/mfa/providers/fido';
const progress = ref(1);
const { data, errors, post, reset } = useForm<FIDOForm>({ data: {
  challengeId: '',
  name: 'My FIDO device',
  response: null,
} });

const regChallenge = ref<FIDORegistrationChallenge | null>(null);

function clear() {
  reset();
  regChallenge.value = null;
  progress.value = 1;
};

async function challenge() {
  const res = await http.get<FIDORegistrationChallenge>(url);

  regChallenge.value = res.data;
  data.value.challengeId = res.data.challenge;

  await startLocalRegistration();
};

async function startLocalRegistration() {
  if (!regChallenge.value)
    return;

  try {
    data.value.response = await startRegistration({ optionsJSON: regChallenge.value });
    progress.value = 2;
  }
  catch {
    regChallenge.value = null;
  }
};

async function verify() {
  const device = await post<MFADeviceResponse>(url);
  emit('registered', device);

  progress.value = 3;
};

defineExpose({ clear });
</script>
