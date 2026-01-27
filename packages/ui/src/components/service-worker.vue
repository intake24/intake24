<template>
  <v-snackbar color="secondary" :model-value="needRefresh" :timeout="-1">
    {{ $t('common.sw.check') }}
    <template #actions>
      <v-btn variant="text" @click="updateServiceWorker">
        {{ $t('common.sw.update') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import type { registerSW } from 'virtual:pwa-register';

import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';

export type UpdateSW = ReturnType<typeof registerSW>;

const intervalMS = 60 * 60 * 1000;

export default defineComponent({
  name: 'ServiceWorker',

  setup() {
    const updateInterval = ref<number | undefined>(undefined);
    const updateSW = ref<UpdateSW | undefined>(undefined);
    const offlineReady = ref(false);
    const needRefresh = ref(false);

    /* async function closePromptUpdateSW() {
      offlineReady.value = false;
      needRefresh.value = false;
    }; */

    function onOfflineReadyFn() {
      console.log('[sw] Offline content is ready.');
    };

    function onNeedRefreshFn() {
      console.log('[sw] New content is available.');
    };

    function updateServiceWorker() {
      if (updateSW.value)
        updateSW.value(true);
    };

    function handleSWManualUpdates(_swRegistration: ServiceWorkerRegistration) {
      console.log('[sw] Service worker has been registered.');
    };

    function handleSWRegisterError(error: any) {
      if (error instanceof Error) {
        const { message, name, stack } = error;
        console.warn('[sw] ServiceWorker registration has failed.');
        console.warn(stack ?? `${name}: ${message}`);
        return;
      }
      console.warn('[sw] ServiceWorker registration has failed.', error);
    };

    onMounted(async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register');

        updateSW.value = registerSW({
          immediate: true,
          onOfflineReady: () => {
            offlineReady.value = true;
            onOfflineReadyFn();
          },
          onNeedRefresh: () => {
            needRefresh.value = true;
            onNeedRefreshFn();
          },
          onRegisteredSW: (swScriptUrl, swRegistration) => {
            if (!swRegistration) {
              console.warn('[sw] ServiceWorker registration has failed.');
              return;
            }

            handleSWManualUpdates(swRegistration);

            // @ts-expect-error - node types
            updateInterval.value = setInterval(async () => {
              if (!(!swRegistration.installing && navigator))
                return;

              if (('connection' in navigator) && !navigator.onLine)
                return;

              const resp = await fetch(swScriptUrl, {
                cache: 'no-store',
                headers: { cache: 'no-store', 'cache-control': 'no-cache' },
              });

              if (resp?.status === 200) {
                console.log('[sw] ServiceWorker checking for updates...');
                await swRegistration.update();
              }
            }, intervalMS);
          },
          onRegisterError: (e) => {
            handleSWRegisterError(e);
          },
        });
      }
      catch {
        console.log('[sw] PWA disabled.');
      }
    });

    onBeforeUnmount(() => {
      clearInterval(updateInterval.value);
    });

    return {
      needRefresh,
      updateServiceWorker,
    };
  },
});
</script>
