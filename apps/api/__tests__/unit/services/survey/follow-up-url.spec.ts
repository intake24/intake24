import { resolveFollowUpUrl } from '@intake24/api/services/survey/survey.service';

describe('resolveFollowUpUrl', () => {
  it('should encode identifier inserted into template', () => {
    expect(resolveFollowUpUrl('https://example.com/?id={identifier}', 'a&b=c#d'))
      .toBe('https://example.com/?id=a%26b%3Dc%23d');
  });

  it('should replace all placeholders and ignore replacement patterns', () => {
    expect(resolveFollowUpUrl('https://example.com/{identifier}?id={identifier}', '$\'$&'))
      .toBe('https://example.com/%24\'%24%26?id=%24%27%24%26');
  });

  it('should use identifier as-is when template is whole URL placeholder', () => {
    expect(resolveFollowUpUrl('{identifier}', 'https://example.com/path?x=1'))
      .toBe('https://example.com/path?x=1');
  });

  it.each([
    ['javascript:alert(1)//{identifier}', 'abc'],
    ['JaVaScRiPt:alert(1)//{identifier}', 'abc'],
    ['data:text/html,{identifier}', 'abc'],
    ['{identifier}', 'javascript:alert(1)'],
  ])('should reject non-http(s) URL %s', (template, identifier) => {
    expect(resolveFollowUpUrl(template, identifier)).toBeNull();
  });

  it('should throw on invalid URL', () => {
    expect(() => resolveFollowUpUrl('{identifier}', 'not a url')).toThrow();
  });
});
