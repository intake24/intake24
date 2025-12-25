import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export type SanitizeInputOptions = {
  emptyStringToNull?: boolean;
  allowHtml?: boolean;
};

export function sanitize(input: any, options: SanitizeInputOptions = {}) {
  const { allowHtml, emptyStringToNull } = options;
  let output = input;

  if (typeof input === 'string') {
    output = DOMPurify.sanitize(
      input,
      allowHtml
        ? {
            USE_PROFILES: { html: true },
            ADD_TAGS: ['iframe'],
            ADD_ATTR: ['allowfullscreen', 'frameborder', 'target'],
          }
        : { USE_PROFILES: { html: false, mathMl: false, svg: false, svgFilters: false } },
    );
    output = output.trim();
    if (emptyStringToNull && !output.length)
      output = null;
  }

  if (Array.isArray(input))
    output = input.map(item => sanitize(item, options));

  if (Object.prototype.toString.call(input) === '[object Object]') {
    output = Object.entries(input).reduce<any>((acc, [key, value]) => {
      acc[key] = sanitize(value, options);
      return acc;
    }, {});
  }

  return output;
}
