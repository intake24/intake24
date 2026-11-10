import { MaxDepthExceededError, sanitize } from '@intake24/common/rules';

function nest(depth: number): unknown {
  let value: unknown = 'leaf';
  for (let i = 0; i < depth; i++) {
    value = i % 2
      ? { a: value }
      : [value];
  }
  return value;
}

describe('input sanitation middleware', () => {
  it('should sanitize/trim input, no HTML by default', () => {
    const input = {
      component: 'checkbox-list-prompt',
      type: 'custom   ',
      id: '   ask-about-diet<math>',
      name: 'Ask About Diet<img src=x onerror=alert(1)//>',
    };

    const output = {
      component: 'checkbox-list-prompt',
      type: 'custom',
      id: 'ask-about-diet',
      name: 'Ask About Diet',
    };

    expect(sanitize(input)).toEqual(output);
  });

  it('should sanitize/trim input, allow safe HTML', () => {
    const input = {
      component: 'checkbox-list-prompt',
      type: 'custom   ',
      id: '   ask-about-diet',
      name: 'Ask About Diet<img src=x onerror=alert(1)//>',
      props: {
        text: {
          en: 'Are you following any kind of special diet?<svg><g/onload=alert(2)//',
        },
        description: {
          en: `<p>If yes, please tick<math><mi//xlink:href="data:x,<script>alert(4)</script>"> the options below
            that best describes your diet (you can tick more than one e.g. vegetarian and gluten free).</p>`,
        },
        conditions: [],
        validation: {
          required: true,
          message: { en: 'Invalid answer<iframe//src=jAva&Tab;script:alert(3)>' },
        },
        label: {
          en: '<iframe allowfullscreen="allowfullscreen" frameborder="0" height="360" width="640" src="https://www.youtube.com/embed/gdsgdf"></iframe>',
        },
        options: {
          en: [
            { label: 'Glu<iframe//src=jAva&Tab;script:alert(3)>ten free', value: 'Gluten free' },
            { label: 'Dairy free', value: 'Dairy fr<iframe//src=jAva&Tab;script:alert(3)>ee' },
          ],
        },
        other: false,
        number: 10,
      },
    };

    const output = {
      component: 'checkbox-list-prompt',
      type: 'custom',
      id: 'ask-about-diet',
      name: 'Ask About Diet<img src="x" />',
      props: {
        text: { en: 'Are you following any kind of special diet?' },
        description: {
          en: `<p>If yes, please tick the options below
            that best describes your diet (you can tick more than one e.g. vegetarian and gluten free).</p>`,
        },
        conditions: [],
        validation: {
          required: true,
          message: { en: 'Invalid answer<iframe></iframe>' },
        },
        label: {
          en: '<iframe allowfullscreen="allowfullscreen" frameborder="0" height="360" width="640" src="https://www.youtube.com/embed/gdsgdf"></iframe>',
        },
        options: {
          en: [
            { label: 'Glu<iframe>ten free</iframe>', value: 'Gluten free' },
            { label: 'Dairy free', value: 'Dairy fr<iframe>ee</iframe>' },
          ],
        },
        other: false,
        number: 10,
      },
    };

    expect(sanitize(input, { allowHtml: true })).toEqual(output);
  });

  it('should sanitize/trim input, allow safe HTML, convert empty strings to nulls', () => {
    const input = {
      component: 'checkbox-list-prompt',
      type: 'custom   ',
      id: '   ask-about-diet',
      name: 'Ask About Diet<img src=x onerror=alert(1)//>',
      props: {
        text: {
          en: 'Are you following any kind of special diet?<svg><g/onload=alert(2)//',
          de: '',
        },
        description: {
          en: '<p>If yes, please tick<math><mi//xlink:href="data:x,<script>alert(4)</script>"> the options below that best describes your diet (you can tick more than one e.g. vegetarian and gluten free).</p>',
        },
        conditions: [],
        validation: {
          required: true,
          message: { en: 'Invalid answer<iframe//src=jAva&Tab;script:alert(3)>' },
        },
        label: { en: '<iframe//src=jAva&Tab;script:alert(3)>Tick some' },
        options: {
          en: [
            { label: 'Glu<iframe//src=jAva&Tab;script:alert(3)>ten free', value: 'Gluten free' },
            { label: '', value: 'Dairy fr<iframe//src=jAva&Tab;script:alert(3)>ee' },
          ],
        },
        other: false,
        number: 10,
      },
    };

    const output = {
      component: 'checkbox-list-prompt',
      type: 'custom',
      id: 'ask-about-diet',
      name: 'Ask About Diet<img src="x" />',
      props: {
        text: { en: 'Are you following any kind of special diet?', de: null },
        description: {
          en: '<p>If yes, please tick the options below that best describes your diet (you can tick more than one e.g. vegetarian and gluten free).</p>',
        },
        conditions: [],
        validation: {
          required: true,
          message: { en: 'Invalid answer<iframe></iframe>' },
        },
        label: { en: '<iframe>Tick some</iframe>' },
        options: {
          en: [
            { label: 'Glu<iframe>ten free</iframe>', value: 'Gluten free' },
            { label: null, value: 'Dairy fr<iframe>ee</iframe>' },
          ],
        },
        other: false,
        number: 10,
      },
    };

    expect(sanitize(input, { allowHtml: true, emptyStringToNull: true })).toEqual(output);
  });

  it('should leave other types unchanged', () => {
    expect(sanitize(undefined, { allowHtml: true, emptyStringToNull: true })).toEqual(undefined);
    expect(sanitize(true, { allowHtml: true, emptyStringToNull: true })).toEqual(true);
  });

  it('should process input up to the default max depth', () => {
    expect(() => sanitize(nest(64))).not.toThrow();
  });

  it('should throw when input exceeds the default max depth', () => {
    expect(() => sanitize(nest(65))).toThrow(MaxDepthExceededError);
  });

  it('should respect custom max depth', () => {
    expect(() => sanitize(nest(2), { maxDepth: 2 })).not.toThrow();
    expect(() => sanitize(nest(3), { maxDepth: 2 })).toThrow(MaxDepthExceededError);
  });

  it('should not count scalars towards depth', () => {
    expect(() => sanitize('  x  ', { maxDepth: 0 })).not.toThrow();
  });
});
