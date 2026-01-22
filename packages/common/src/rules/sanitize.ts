import sanitizeHtml from 'sanitize-html';

export type SanitizeInputOptions = {
  emptyStringToNull?: boolean;
  allowHtml?: boolean;
};

export function sanitize<T = string>(input: T, options: SanitizeInputOptions = {}): T {
  const { allowHtml, emptyStringToNull } = options;
  // let output = input;

  if (typeof input === 'string') {
    let output: string | null = allowHtml
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

    return output as any;
  }

  if (Array.isArray(input))
    return input.map(item => sanitize(item, options)) as any;

  if (Object.prototype.toString.call(input) === '[object Object]') {
    return Object.entries(input as Record<string, unknown>).reduce<any>((acc, [key, value]) => {
      acc[key] = sanitize(value, options);
      return acc;
    }, {}) as any;
  }

  return input as any;
}
