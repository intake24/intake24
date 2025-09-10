export interface PkgLocale {
  id: string;
  englishName: string;
  localName: string;
  respondentLanguage: string;
  adminLanguage: string;
  flagCode: string;
  textDirection: 'ltr' | 'rtl';
  foodIndexLanguageBackendId?: string;
}
