import { computed, onMounted, ref } from 'vue';
import { useHttp } from '@intake24/admin/services';

export function useWebPush() {
  const http = useHttp();

  const permission = ref<NotificationPermission | null>(null);
  const isPermissionGranted = computed(() => permission.value === 'granted');
  const isWebPushSupported = computed(() => {
    const { protocol, hostname } = window.location;

    return (
      (hostname === 'localhost' || protocol === 'https:')
      && 'Notification' in window
      && 'serviceWorker' in navigator
    );
  });

  async function requestPermission() {
    if (!isWebPushSupported.value)
      return;

    permission.value = await Notification.requestPermission();

    if (isPermissionGranted.value)
      await subscribe();
  };

  async function subscribe() {
    if (!isPermissionGranted.value)
      return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration)
      return;

    const { pushManager } = registration;

    let subscription = await pushManager.getSubscription();

    if (!subscription) {
      subscription = await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_WEBPUSH_PUBLIC_KEY,
      });
    }
    await http.post('subscriptions', { subscription });
  };

  onMounted(async () => {
    if (!isWebPushSupported.value) {
      console.warn(`Notification or serviceWorker API not supported by browser.`);
      return;
    }

    permission.value = Notification.permission;
  });

  return {
    isPermissionGranted,
    isWebPushSupported,
    permission,
    requestPermission,
    subscribe,
  };
}
