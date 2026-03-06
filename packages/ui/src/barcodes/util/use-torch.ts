import { ref } from 'vue';

export function useTorch() {
  const hasTorch = ref(false);

  async function getActiveTrack() {
    if (!('mediaDevices' in navigator))
      return null;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(({ kind }) => kind === 'videoinput');

    if (!cameras.length)
      return null;

    const camera = cameras.at(-1);
    if (!camera)
      return null;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: camera.deviceId,
        facingMode: 'environment',
        height: { ideal: 1080 },
        width: { ideal: 1920 },
      },
    });

    return stream.getVideoTracks()[0];
  }

  async function initTorch() {
    const track = await getActiveTrack();
    if (!track)
      return;

    const capabilities = track.getCapabilities();
    track.stop();

    hasTorch.value = 'torch' in capabilities && typeof capabilities.torch === 'boolean';
  }

  async function toggleTorch(state?: boolean) {
    const track = await getActiveTrack();
    if (!track)
      return;

    // @ts-expect-error torch is not in the types ?
    await track.applyConstraints({ advanced: [{ torch: typeof state === 'boolean' ? state : !track.getSettings().torch }] });
    track.stop();
  }

  return { hasTorch, initTorch, toggleTorch };
}
