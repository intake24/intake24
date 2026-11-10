import sanitizeHtml from 'sanitize-html';

import { DEFAULT_MAX_DEPTH, MaxDepthExceededError } from './max-depth';

export type SanitizeInputOptions = {
  emptyStringToNull?: boolean;
  allowHtml?: boolean;
  maxDepth?: number;
};

export function sanitize<T = string>(input: T, options: SanitizeInputOptions = {}): T {
  return sanitizeAtDepth(input, options, 0);
}

function sanitizeAtDepth<T>(input: T, options: SanitizeInputOptions, depth: number): T {
  const { allowHtml, emptyStringToNull, maxDepth = DEFAULT_MAX_DEPTH } = options;

  if (typeof input === 'string') {
    let output: string | null = allowHtml
      ? sanitizeHtml(input, {
          allowedTags: [
            ...sanitizeHtml.defaults.allowedTags,
            ...['iframe', 'img'],
          ],
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            iframe: [
              'src',
              'width',
              'height',
              'frameborder',
              'allow',
              'allowfullscreen',
            ],
            img: [
              'src',
              'srcset',
              'alt',
              'title',
              'width',
              'height',
              'loading',
            ],
            '*': ['style'],
          },
        })
      : sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
    output = output.trim();
    if (emptyStringToNull && !output.length)
      output = null;

    return output as T;
  }

  const isArray = Array.isArray(input);
  const isObject = !isArray && Object.prototype.toString.call(input) === '[object Object]';
  if (!isArray && !isObject)
    return input;

  if (depth >= maxDepth)
    throw new MaxDepthExceededError(maxDepth);

  if (isArray)
    return input.map(item => sanitizeAtDepth(item, options, depth + 1)) as T;

  return Object.entries(input as Record<string, unknown>).reduce<any>((acc, [key, value]) => {
    acc[key] = sanitizeAtDepth(value, options, depth + 1);
    return acc;
  }, {}) as T;
}
