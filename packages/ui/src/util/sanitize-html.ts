import type { Plugin } from 'vue';

import VueDOMPurifyHTML from 'vue-dompurify-html';

// Extends DOMPurify defaults to match the server-side allowlist (@intake24/common/rules/sanitize), which keeps embedded iframes and link targets.
export const sanitizeHtmlPlugin: Plugin = {
  install(app) {
    app.use(VueDOMPurifyHTML, {
      default: {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: [
          'target',
          'allow',
          'allowfullscreen',
          'frameborder',
        ],
      },
    });
  },
};
