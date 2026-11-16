import type { Translation } from 'vanilla-cookieconsent';

import { cookieConsentConfig } from './config';

describe('cookieConsentConfig', () => {
  it('should sanitize nested translation strings', () => {
    const { language: { translations } } = cookieConsentConfig({
      en: {
        consentModal: { title: 'Cookies <img src=x onerror=alert(1)>' },
        preferencesModal: {
          sections: [
            { title: '<span class="pm__badge">Always</span><script>alert(1)</script>' },
          ],
        },
      } as Translation,
    });

    const { consentModal, preferencesModal } = translations.en as Translation;
    expect(consentModal.title).toBe('Cookies <img src="x">');
    expect(preferencesModal.sections[0].title).toBe('<span class="pm__badge">Always</span>');
  });
});
