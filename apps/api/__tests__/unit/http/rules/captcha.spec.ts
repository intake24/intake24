import type { CaptchaConfig } from '@intake24/api/config';
import { captcha } from '@intake24/api/http/rules';

describe('captcha middleware', () => {
  it('should pass when re-captcha disabled', async () => {
    const config: CaptchaConfig = {
      provider: null,
      secret: 'aSuperSecret',
    };

    const result = await captcha('ReCaptchaChallengeToken', config);
    expect(result).toBeUndefined();
  });

  it('should fail when token is not string', async () => {
    const config: CaptchaConfig = {
      provider: 're-captcha',
      secret: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
    };

    expect.assertions(1);

    try {
      await captcha(undefined, config);
    }
    catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('should fail when token is missing', async () => {
    const config: CaptchaConfig = {
      provider: 're-captcha',
      secret: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
    };

    expect.assertions(1);

    try {
      await captcha('', config);
    }
    catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('should fail when secret is invalid', async () => {
    const config: CaptchaConfig = {
      provider: 're-captcha',
      secret: 'invalidSecret',
    };

    expect.assertions(1);

    try {
      await captcha('CaptchaChallengeToken', config);
    }
    catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('should pass token challenge', async () => {
    const config: CaptchaConfig = {
      provider: 're-captcha',
      secret: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
    };

    const result = await captcha('CaptchaChallengeToken', config);
    expect(result).toBeUndefined();
  });
});
