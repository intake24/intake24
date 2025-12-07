import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DOMPurify = createDOMPurify(new JSDOM('').window);

export type SanitizeInputOptions = {
  emptyStringToNull?: boolean;
  allowHtml?: boolean;
};

function createSanitizer({ allowHtml, emptyStringToNull }: SanitizeInputOptions = {}) {
  const sanitize = (input: any) => {
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
      output = input.map(item => sanitize(item));

    if (Object.prototype.toString.call(input) === '[object Object]') {
      output = Object.entries(input).reduce<any>((acc, [key, value]) => {
        acc[key] = sanitize(value);
        return acc;
      }, {});
    }

    return output;
  };

  return sanitize;
}

export default createSanitizer;
