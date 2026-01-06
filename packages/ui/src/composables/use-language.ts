import type { Translation } from 'vanilla-cookieconsent';
import type { useLocale } from 'vuetify';

import type { HttpClient } from '../types';
import get from 'lodash/get';
import mergeWith from 'lodash/mergeWith';

import { computed, onMounted, toRaw, watch } from 'vue';
import type { I18nLanguageEntry, I18nLanguageListEntry } from '@intake24/common/types/http';
import { defaultMessages, loadAppLanguage, useI18n } from '@intake24/i18n';
import { cookieConsentConfig, useCookieConsent } from '../cookie-consent';
import { useApp } from '../stores';

const jsonCookieConsentCache: Record<string, Translation> = {};

function mergeTranslations(jsonMessages: Record<string, any>, dbMessages: Record<string, any>): Record<string, any> {
  return mergeWith({}, jsonMessages, dbMessages, (objValue, srcValue) => {
    if (Array.isArray(srcValue))
      return srcValue;
    return undefined;
  });
}

export function useLanguage(app: 'admin' | 'survey', http: HttpClient, vI18n: ReturnType<typeof useLocale>) {
  const appStore = useApp();
  const { i18n } = useI18n();
  const cc = useCookieConsent();

  async function loadCookieConsentLang(lang: string) {
    const languages = i18n.availableLocales;
    const { translations } = cc.getConfig('language');

    for (const item of languages) {
      if (translations[item])
        continue;

      const cachedTranslation = jsonCookieConsentCache[item]
        ?? toRaw(get(i18n.getLocaleMessage(item), 'legal.cookies.consent')) as Translation | undefined;

      if (cachedTranslation) {
        translations[item] = cachedTranslation;
      }
    }

    cc.reset();
    await cc.run(cookieConsentConfig(translations, lang));
  }

  const fallbackLanguages = computed(() => {
    if (!i18n.fallbackLocale.value)
      return [];

    if (typeof i18n.fallbackLocale.value === 'string')
      return [i18n.fallbackLocale.value];

    return Array.isArray(i18n.fallbackLocale.value) ? i18n.fallbackLocale.value : Object.keys(i18n.fallbackLocale.value);
  });

  const getLanguages = (languageId: string): string[] => [
    ...new Set(
      [languageId, languageId.split('-')[0], ...fallbackLanguages.value].filter(Boolean),
    ),
  ];

  const hasLanguage = (languageId: string) => i18n.availableLocales.includes(languageId);

  const updateAppWithLanguage = (languageId: string, _isRtl?: boolean) => {
    i18n.locale.value = languageId;
    vI18n.current.value = languageId;

    document.querySelector('html')?.setAttribute('lang', languageId);
    http.axios.defaults.headers.common['Accept-Language'] = languageId;
  };

  const setLanguage = async (languageId: string) => {
    if (languageId === i18n.locale.value)
      return;

    let language = languageId || appStore.lang;
    let isRtl: boolean | undefined;
    let dbMessages: Record<string, any> | undefined;

    try {
      const {
        data: { code, messages, textDirection },
      } = await http.get<I18nLanguageEntry>(`i18n/${language}`, { params: { app } });

      if (Object.keys(messages).length)
        dbMessages = messages;

      language = code;
      isRtl = textDirection === 'rtl';
    }
    catch {
      // API call failed, use fallback
    }

    for (const lang of getLanguages(language)) {
      await loadAppLanguage(app, lang, !!dbMessages);

      if (hasLanguage(lang)) {
        if (!jsonCookieConsentCache[lang]) {
          const jsonMessages = toRaw(i18n.getLocaleMessage(lang));
          const ccTranslation = get(jsonMessages, 'legal.cookies.consent') as Translation | undefined;
          if (ccTranslation) {
            jsonCookieConsentCache[lang] = ccTranslation;
          }
        }

        if (dbMessages) {
          const jsonMessages = toRaw(i18n.getLocaleMessage(lang));
          const merged = mergeTranslations(jsonMessages, dbMessages);
          i18n.setLocaleMessage(lang, merged);
          defaultMessages.setMessages(lang, merged);
        }

        updateAppWithLanguage(lang, isRtl);
        appStore.setLanguage(lang);
        await loadCookieConsentLang(lang);
        break;
      }
    }
  };

  watch(() => appStore.lang, async (val) => {
    await setLanguage(val);
  });

  onMounted(async () => {
    const { data } = await http.get<I18nLanguageListEntry[]>('i18n');
    appStore.setLanguages(data);

    await setLanguage(appStore.lang || navigator.language || navigator.userLanguage);

    if (!Object.keys(cc.getConfig('language').translations).length)
      await loadCookieConsentLang(i18n.locale.value);
  });
}
