import { computed } from 'vue';

export function useFooter() {
  const links = computed(() => ({
    home: import.meta.env.VITE_LEGAL_HOME,
    copyright: import.meta.env.VITE_LEGAL_COPYRIGHT,
    privacy: import.meta.env.VITE_LEGAL_PRIVACY,
    terms: import.meta.env.VITE_LEGAL_TERMS,
    contact: `${import.meta.env.VITE_LEGAL_HOME}/contact`,
  }));

  return {
    links,
  };
}
