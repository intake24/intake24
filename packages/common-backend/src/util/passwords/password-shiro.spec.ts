import { PasswordShiro } from '@intake24/common-backend';

describe('passwordShiro', () => {
  it('should throw when new password created', async () => {
    const password = new PasswordShiro();
    await expect(password.hash('password')).rejects.toThrow(Error);
  });

  it('should pass on correct password', async () => {
    const password = new PasswordShiro();
    const result = await password.verify('password', {
      hash: 'Xexyo8Yb0H/Ox0Isl3xPFmqD4fpQs+8DQZx92MFaSDY=',
      salt: 'hVI1j0K84CdzMVZThDD1hg==',
    });

    expect(result).toBe(true);
  });

  it('should fail on incorrect password', async () => {
    const password = new PasswordShiro();
    const result = await password.verify('password', {
      hash: 'Xexyo8Yb0H/Ox0Isl3xPFmqD4fpQs+8DQZx92MFaSDY=',
      salt: 'incorrect-salt',
    });

    expect(result).toBe(false);
  });
});
