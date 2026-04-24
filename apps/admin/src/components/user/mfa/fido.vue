<template>
  <v-stepper-vertical v-model="progress" flat hide-actions>
    <template #default="{ step }">
      <v-stepper-vertical-item
        :complete="step > 1"
        :title="$t('user.mfa.providers.fido.challenge.title')"
        value="1"
      >
        <div class="text-subtitle-2">
          {{ $t('user.mfa.providers.fido.challenge.text') }}
        </div>
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
              {{ $t('user.mfa.providers.fido.challenge._') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item
        :complete="step > 2"
        :title="$t('user.mfa.providers.fido.verify.title')"
        value="2"
      >
        <v-container>
          <v-row>
            <v-col cols="12" sm="8">
              <v-form @submit.prevent="verify">
                <v-text-field
                  v-model="data.name"
                  class="mb-4"
                  :error-messages="errors.get('name')"
                  :label="$t('user.mfa.devices.name._')"
                  name="name"
                  @update:model-value="errors.clear('name')"
                />
                <v-btn block color="secondary" rounded type="submit">
                  {{ $t('user.mfa.providers.fido.verify._') }}
                </v-btn>
              </v-form>
            </v-col>
          </v-row>
        </v-container>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item
        :complete="step >= 3"
        :title="$t('user.mfa.providers.fido.finalize.title')"
        value="3"
      >
        <div class="d-flex flex-column ga-4">
          <div>
            {{ $t('user.mfa.providers.fido.finalize.text') }}
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

const emit = defineEmits(['close', 'registered']);

const http = useHttp();

const url = 'admin/user/mfa/providers/fido';
const progress = ref(1);
const { data, errors, post, reset } = useForm<FIDOForm>({ data: {
  challengeId: '',
  name: 'FIDO device',
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
