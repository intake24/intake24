<template>
  <v-stepper-vertical v-model="progress" flat hide-actions>
    <template #default="{ step }">
      <v-stepper-vertical-item :complete="step > 1" :title="$t('user.mfa.providers.duo.challenge.title')" value="1">
        <div class="text-subtitle-2">
          {{ $t('user.mfa.providers.duo.challenge.text') }}
        </div>
        <v-row>
          <v-col cols="12" sm="6">
            <v-btn block class="my-4" color="secondary" rounded @click="challenge">
              {{ $t('user.mfa.providers.duo.challenge._') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item :complete="step > 2" :title="$t('user.mfa.providers.duo.verify.title')" value="2">
        <v-container>
          <v-row>
            <v-col cols="12" sm="8">
              <v-form @submit.prevent="verify">
                <v-text-field
                  v-model="data.name"
                  :error-messages="errors.get('name')"
                  :label="$t('user.mfa.devices.name._')"
                  name="name"
                  @update:model-value="errors.clear('name')"
                />
                <v-btn block class="my-4" color="secondary" rounded type="submit">
                  {{ $t('user.mfa.providers.duo.verify._') }}
                </v-btn>
              </v-form>
            </v-col>
          </v-row>
        </v-container>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item
        :complete="step >= 3"
        :title="$t('user.mfa.providers.duo.finalize.title')"
        value="3"
      >
        <div class="d-flex flex-column ga-4">
          <div>
            {{ $t('user.mfa.providers.duo.finalize.text') }}
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
  DuoRegistrationChallenge,
  MFADeviceResponse,
} from '@intake24/common/types/http/admin';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';

defineOptions({ name: 'DuoDevice' });

const emit = defineEmits(['close', 'registered']);

const route = useRoute();
const router = useRouter();
const http = useHttp();

const url = 'admin/user/mfa/providers/duo';
const progress = ref(1);
const { data, errors, post, reset } = useForm({ data: { challengeId: '', name: 'Duo Device', token: '' } });

async function loadDuoRegistration() {
  const { state: challengeId, code: token } = route.query;
  if (typeof challengeId !== 'string' || typeof token !== 'string')
    return;

  data.value.challengeId = challengeId;
  data.value.token = token;
  progress.value = 2;
};

function clear() {
  reset();
  progress.value = 1;
};

async function challenge() {
  const {
    data: { challengeUrl },
  } = await http.get<DuoRegistrationChallenge>(url);

  window.location.href = challengeUrl;
};

async function verify() {
  const device = await post<MFADeviceResponse>(url);

  emit('registered', device);
  router.replace({ query: {} });

  progress.value = 3;
};

onMounted(async () => {
  await loadDuoRegistration();
});

defineExpose({ clear });
</script>
