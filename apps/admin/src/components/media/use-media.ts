import type { MediaEntry } from '@intake24/common/types/http/admin';

import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useHttp } from '@intake24/admin/services';
import { useResource } from '@intake24/admin/stores';

// check for a valid media path and extract the media ID -> UUID and the first two characters of the UUID (used for storage path)
const regex = /(?:^|\/)([0-9a-f]{2})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:$|\/)/i; ;

export function useMedia(url?: string) {
  const http = useHttp();
  const route = useRoute();
  const resource = useResource();

  const uploadUrl = computed(() => url ?? `admin/${resource.name}${route.params.id ? `/${route.params.id}` : ''}/media`);

  function extractMediaId(path: string): string | undefined {
    const [_, prefix, uuid] = path.match(regex) ?? [];
    if (!prefix || !uuid || prefix !== uuid.substring(0, 2))
      return undefined;

    return uuid;
  }

  function getFullURL(url: string) {
    const sameOrigin = new URL(document.baseURI).origin === new URL(url, document.baseURI).origin;
    return sameOrigin && import.meta.env.VITE_API_HOST ? `${import.meta.env.VITE_API_HOST}/${url}` : url;
  }

  function getRelativeURL(url: string) {
    try {
      const { pathname, search, hash } = new URL(url);
      return `${pathname}${search}${hash}`;
    }
    catch (error) {
      console.error('Invalid URL:', error);
      return '';
    }
  }

  async function uploadMedia(file: File, collection: string, disk: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);
    formData.append('disk', disk);

    try {
      const { data } = await http.post<MediaEntry>(uploadUrl.value, formData);
      return data;
    }
    catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  async function deleteMedia(mediaId: string) {
    await http.delete(`${uploadUrl.value}/${mediaId}`);
  }

  return { extractMediaId, getFullURL, getRelativeURL, uploadUrl, uploadMedia, deleteMedia };
}
