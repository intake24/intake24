<template>
  <v-stepper-vertical v-model="progress" flat hide-actions>
    <template #default="{ step }">
      <v-stepper-vertical-item :complete="step > 1" :title="$t('user.mfa.devices.init.title')" value="1">
        <v-row>
          <v-col cols="12" sm="6">
            <v-btn block class="my-4" color="secondary" rounded @click="challenge">
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
  DuoRegistrationChallenge,
  MFADeviceResponse,
} from '@intake24/common/types/http/admin';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';

defineOptions({ name: 'DuoDevice' });

const emit = defineEmits(['registered']);

const route = useRoute();
const router = useRouter();
const http = useHttp();

const url = 'admin/user/mfa/providers/duo';
const progress = ref(1);
const { data, errors, post, reset } = useForm({ data: { challengeId: '', name: 'My Duo Device', token: '' } });

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
