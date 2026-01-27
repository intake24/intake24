<template>
  <v-list>
    <v-list-subheader>{{ $t('user.mfa.title') }}</v-list-subheader>
  </v-list>
  <v-card-text class="d-flex flex-row align-center justify-space-between">
    <v-switch
      v-model="status"
      class="my-auto"
      :disabled="!devices.length"
      hide-details="auto"
      :label="$t(`user.mfa.${status ? 'disable' : 'enable'}`)"
      name="status"
      @update:model-value="toggle"
    />
    <v-alert
      v-if="!devices.length"
      class="my-auto ml-4"
      density="compact"
      type="info"
    >
      {{ $t('user.mfa.disabled') }}
    </v-alert>
  </v-card-text>
  <v-toolbar flat>
    <v-toolbar-title>
      {{ $t('user.mfa.devices.title') }}
    </v-toolbar-title>
    <v-spacer />
    <v-dialog v-model="dialog" :fullscreen="$vuetify.display.mobile" max-width="600px">
      <template #activator="{ props }">
        <v-btn

          color="primary"
          rounded
          :title="$t('user.mfa.devices.add')"
          variant="flat"
          v-bind="props"
        >
          <v-icon icon="$add" start />
          {{ $t('user.mfa.devices.add') }}
        </v-btn>
      </template>
      <v-card :tile="$vuetify.display.mobile">
        <v-toolbar color="secondary">
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
          <v-toolbar-title>
            {{ $t('user.mfa.devices.add') }}
          </v-toolbar-title>
        </v-toolbar>
        <v-tabs v-model="tab" bg-color="secondary" grow @update:model-value="clear">
          <v-tab v-for="provider in providers" :key="provider" :value="provider">
            <v-icon :icon="`$${provider}`" start />
            {{ $t(`user.mfa.providers.${provider}._`) }}
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item v-for="provider in providers" :key="provider" :value="provider">
            <v-card flat>
              <v-card-title class="text-h5 font-weight-bold mb-2">
                {{ $t(`user.mfa.providers.${provider}.title`) }}
              </v-card-title>
              <v-card-subtitle>
                {{ $t(`user.mfa.providers.${provider}.description`) }}
              </v-card-subtitle>
              <component :is="provider" ref="providerRefs" @registered="add" />
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-dialog>
  </v-toolbar>
  <v-list class="list-border">
    <transition-group v-if="devices.length" name="drag-and-drop">
      <v-list-item v-for="(device, idx) in devices" :key="device.id" link>
        <template #prepend>
          <v-icon :title="$t(`user.mfa.providers.${device.provider}._`)">
            {{ `$${device.provider}` }}
          </v-icon>
        </template>
        <v-list-item-title>{{ device.name }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ $t(`user.mfa.providers.${device.provider}.title`) }}
        </v-list-item-subtitle>
        <template #append>
          <v-list-item-action>
            <v-chip v-if="device.preferred" color="secondary" variant="outlined">
              {{ $t('user.mfa.devices.preferred._') }}
            </v-chip>
            <confirm-dialog
              v-else
              color="secondary"
              icon
              icon-left="far fa-circle-up"
              :label="$t('user.mfa.devices.preferred.promote')"
              @confirm="promote(device.id, idx)"
            >
              {{ $t('user.mfa.devices.preferred.promoteConfirm', { name: device.name }) }}
            </confirm-dialog>
          </v-list-item-action>
          <v-list-item-action>
            <confirm-dialog
              color="error"
              icon
              icon-left="$delete"
              :label="$t('user.mfa.devices.remove')"
              @confirm="remove(device.id)"
            >
              {{ $t('common.action.confirm.delete', { name: device.name }) }}
            </confirm-dialog>
          </v-list-item-action>
        </template>
      </v-list-item>
    </transition-group>
    <v-list-item v-else>
      <v-list-item-title>{{ $t('user.mfa.devices.none') }}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import type { MFADeviceResponse, MFADevicesResponse } from '@intake24/common/types/http/admin';

import { HttpStatusCode, isAxiosError } from 'axios';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useHttp } from '@intake24/admin/services';
import { useMessages } from '@intake24/admin/stores';
import { mfaProviders } from '@intake24/common/security';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import Duo from './duo.vue';
import Fido from './fido.vue';
import Otp from './otp.vue';

defineOptions({
  name: 'UserMFA',
  components: { Duo, Otp, Fido },
});

const { i18n: { t } } = useI18n();
const http = useHttp();
const route = useRoute();

const providerRefs = ref<InstanceType<typeof Otp | typeof Fido | typeof Duo>[]>();

const dialog = ref(false);
const tab = ref(mfaProviders[0]);
const status = ref(false);
const devices = ref<MFADeviceResponse[]>([]);
const providers = ref(mfaProviders);

onMounted(async () => {
  const { data } = await http.get<MFADevicesResponse>('admin/user/mfa');

  status.value = data.status;
  devices.value = data.devices;

  await checkDuoRegistrationResponse();
});

async function checkDuoRegistrationResponse() {
  const { state: challengeId, code: token } = route.query;
  if (typeof challengeId !== 'string' || typeof token !== 'string')
    return;

  tab.value = 'duo';
  dialog.value = true;
};

async function toggle() {
  if (!devices.value.length) {
    useMessages().info(t('user.mfa.devices.none'));
    return;
  }

  try {
    await http.post('admin/user/mfa/toggle', { status: status.value });
  }
  catch (err) {
    if (isAxiosError(err) && err.response?.status === HttpStatusCode.NotFound) {
      useMessages().info(t('user.mfa.devices.none'));
      return;
    }

    throw err;
  }
};

async function promote(id: string, idx: number) {
  const { data } = await http.patch<MFADeviceResponse>(`admin/user/mfa/devices/${id}`, { preferred: true });
  devices.value[0].preferred = false;
  devices.value.splice(idx, 1);
  devices.value.splice(0, 0, data);
};

function add(device: MFADeviceResponse) {
  devices.value.push(device);
};

async function remove(deviceId: string) {
  await http.delete(`admin/user/mfa/devices/${deviceId}`);
  devices.value = devices.value.filter(device => device.id !== deviceId);
  if (!devices.value.length || devices.value.find(device => device.preferred))
    return;

  const { data } = await http.patch<MFADeviceResponse>(
    `admin/user/mfa/devices/${devices.value[0].id}`,
    { preferred: true },
  );
  devices.value.splice(0, 1, data);
};

function clear() {
  providerRefs.value?.forEach(item => item.clear());
};

function close() {
  dialog.value = false;
};

watch(dialog, (val) => {
  if (!val)
    clear();
});
</script>
