import type { HasVideo, Prompt } from '@intake24/common/prompts';

import { usePlayer } from '@vue-youtube/core';
import { ref, useTemplateRef } from 'vue';

export type UseYoutubeVideoProps = Prompt & HasVideo;

const ytPlayerStates = {
  unstarted: -1,
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
  cued: 5,
} as const;

export function useYoutubeVideo(props: UseYoutubeVideoProps, callback?: (type: string, ...args: [id?: string, params?: object]) => void) {
  const video = useTemplateRef<InstanceType<typeof HTMLElement>>('video');
  const watched = ref(false);

  if (!props.video)
    return { video, watched };

  const { onStateChange, instance: player } = usePlayer(props.video.videoId, video, {
    playerVars: {
      autoplay: props.video.autoplay ? 1 : 0,
      controls: props.video.required ? 0 : 1,
      disablekb: props.video.required ? 1 : 0,
      origin: window.location.origin,
      rel: 0,
    },
    height: props.video.height,
    width: props.video.width,
  });

  onStateChange((event) => {
    const { data } = event;

    switch (data) {
      case ytPlayerStates.ended: {
        watched.value = true;

        if (props.video?.autoContinue && callback)
          callback('next');

        break;
      }
      default:
        break;
    }
  });

  return {
    player,
    video,
    watched,
  };
}
