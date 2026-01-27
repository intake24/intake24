<template>
  <v-alert
    v-if="isWebPushSupported"
    border="start"
    closable
    prominent
    type="info"
  >
    <p class="text-subtitle-1">
      Application can send you push notifications.
    </p>
    <p class="text-caption">
      Push notifications can let you know when result is ready so you don't have to manually check
      for it. E.g. if you submit a job, which runs in background and is finished later. You don't
      have to re-check the status as you will get notified with push notification.
    </p>
    <v-divider class="my-4 bg-primary" style="opacity: 0.5" />
    <div v-if="isPermissionGranted" class="d-flex flex-column ga-2 flex-md-row justify-md-space-between align-md-center">
      <div class="text-subtitle-2">
        Push notifications are allowed. You can give it a test to see how it will look like.
      </div>
      <v-btn color="info" @click="testWebPush">
        Test PUSH
      </v-btn>
    </div>
    <div v-else class="d-flex flex-column ga-2 flex-md-row justify-md-space-between align-md-center">
      <div class="text-subtitle-2">
        Click on "Allow PUSH" and confirm the notification in browser's pop-up.
      </div>
      <v-btn color="info" @click="requestPermission">
        Allow PUSH
      </v-btn>
    </div>
  </v-alert>
</template>

<script lang="ts" setup>
import { useHttp } from '@intake24/admin/services';

import { useWebPush } from './use-web-push';

const http = useHttp();
const { isPermissionGranted, isWebPushSupported, requestPermission } = useWebPush();

async function testWebPush() {
  await http.post('subscriptions/push');
};
</script>
