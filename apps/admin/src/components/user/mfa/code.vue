<template>
  <v-stepper-vertical v-model="progress" flat hide-actions>
    <template #default="{ step }">
      <v-stepper-vertical-item :complete="step > 1" :title="$t('user.mfa.providers.code.challenge.title')" value="1">
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
              {{ $t('user.mfa.providers.code.challenge._') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item :complete="step > 2" :title="$t('user.mfa.providers.code.verify.title')" value="2">
        <p class="mb-4 text-subtitle-2">
          {{ $t('user.mfa.providers.code.verify.text') }}
        </p>
        <v-row>
          <v-col cols="12" sm="8">
            <v-form @submit.prevent="verify">
              <v-text-field
                v-model="data.name"
                class="mb-4"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('user.mfa.devices.name._')"
                name="name"
                variant="outlined"
                @update:model-value="errors.clear('name')"
              />
              <v-text-field
                v-model="data.password"
                autocomplete="off"
                class="mb-4"
                :error-messages="errors.get('password')"
                :label="$t('common.password._')"
                name="password"
                prepend-inner-icon="fas fa-key"
                type="password"
                @update:model-value="errors.clear('password')"
              />
              <v-btn block class="my-4" color="secondary" rounded type="submit">
                {{ $t('user.mfa.providers.code.verify._') }}
              </v-btn>
            </v-form>
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
          <v-card v-if="codes.length" class="pa-4" color="info" icon="fas fa-exclamation-mark" variant="tonal">
            <div class="mb-2 text-subtitle-2 ">
              {{ $t('user.mfa.providers.code.finalize.codes') }}
            </div>
            <div class="d-flex ga-2 flex-wrap">
              <v-chip
                v-for="code in codes"
                :key="code"
                color="primary"
                variant="flat"
              >
                {{ code }}
              </v-chip>
            </div>
          </v-card>
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
  CodeDeviceResponse,
  CodeRegistrationChallenge,
} from '@intake24/common/types/http/admin';

import { ref } from 'vue';

import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';

defineOptions({ name: 'CodeDevice' });

const emit = defineEmits(['close', 'registered']);

const http = useHttp();

const url = 'admin/user/mfa/providers/code';
const progress = ref(1);
const { data, errors, post, reset } = useForm({ data: { challengeId: '', name: 'Backup codes', password: '' } });
const codes = ref<string[]>([]);

const regChallenge = ref<CodeRegistrationChallenge | null>(null);

function clear() {
  reset();
  regChallenge.value = null;
  progress.value = 1;
};

async function challenge() {
  const res = await http.get<CodeRegistrationChallenge>(url);

  regChallenge.value = res.data;
  data.value.challengeId = res.data.challengeId;

  progress.value = 2;
};

async function verify() {
  const data = await post<CodeDeviceResponse>(url);
  codes.value = data.codes;

  emit('registered', data.device);

  progress.value = 3;
};

defineExpose({ clear });
</script>
