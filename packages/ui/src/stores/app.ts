import type { I18nLanguageListEntry } from '@intake24/common/types/http';

import { trim } from 'lodash-es';
import { defineStore } from 'pinia';

export type AppState = {
  lang: string;
  langs: I18nLanguageListEntry[];
  restrictedLangs: string[];
  app: {
    api: string;
    host: string;
    name: string;
    docs: string;
    build: {
      version: string;
      revision: string;
      fullVersion: string;
      date: string;
    };
  };
};

export const useApp = defineStore('app', {
  state: (): AppState => ({
    lang: '',
    langs: [],
    restrictedLangs: [],
    app: {
      name: import.meta.env.VITE_APP_NAME,
      host: window.location.host,
      api: [import.meta.env.VITE_API_HOST, import.meta.env.VITE_API_URL]
        .map(item => trim(item, '/'))
        .join('/'),
      docs: import.meta.env.VITE_DOCS_URL || 'https://docs.intake24.org',
      build: {
        version: import.meta.env.VITE_APP_BUILD_VERSION,
        revision: import.meta.env.VITE_APP_BUILD_REVISION,
        fullVersion: `${import.meta.env.VITE_APP_BUILD_VERSION}-${import.meta.env.VITE_APP_BUILD_REVISION}`,
        date: import.meta.env.VITE_APP_BUILD_DATE,
      },
    },
  }),
  persist: {
    pick: ['lang'],
  },
  getters: {
    availableLanguages: state =>
      state.restrictedLangs.length ? state.langs.filter(item => state.restrictedLangs.includes(item.code)) : state.langs,
  },
  actions: {
    setLanguage(language: string) {
      if (!this.restrictedLangs.length) {
        this.lang = language;
        return;
      }

      this.lang = this.restrictedLangs.includes(language) ? language : this.restrictedLangs[0];
    },
    setLanguages(languages: I18nLanguageListEntry[]) {
      this.langs = languages;
    },
    restrictLanguages(languages: string[]) {
      this.restrictedLangs = languages;
      this.setLanguage(this.lang);
    },
  },
});

export type AppStoreDef = typeof useApp;

export type AppStore = ReturnType<AppStoreDef>;
