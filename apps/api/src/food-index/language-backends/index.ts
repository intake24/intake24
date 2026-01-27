import type { LanguageBackend } from '../phrase-index';

import ArabicUAELanguageBackend from './ar-AE/arabic-UAE-language-backend';
import EnglishLanguageBackend from './en/english-language-backend';
import FrenchLanguageBackend from './fr/french-language-backend';

export const languageBackendCodes = ['en', 'fr'];
export type LanguageBackendCodes = typeof languageBackendCodes[number];

export type LanguagesBackend = Record<LanguageBackendCodes, LanguageBackend>;

const languagesBackend: LanguagesBackend = {
  en: EnglishLanguageBackend,
  fr: FrenchLanguageBackend,
  'ar-AE': ArabicUAELanguageBackend,
};

export default languagesBackend;
