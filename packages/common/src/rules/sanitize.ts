import sanitizeHtml from 'sanitize-html';

export type SanitizeInputOptions = {
  emptyStringToNull?: boolean;
  allowHtml?: boolean;
};

export function sanitize(input: any, options: SanitizeInputOptions = {}) {
  const { allowHtml, emptyStringToNull } = options;
  let output = input;

  if (typeof input === 'string') {
    output = allowHtml
      ? sanitizeHtml(input, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['iframe', 'img']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
            img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
            '*': ['style'],
          },
        })
      : sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
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
