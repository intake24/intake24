import type { IoC } from '@intake24/api/ioc';

import * as oidc from 'openid-client';
import { vi } from 'vitest';

import { UnauthorizedError } from '@intake24/api/http/errors';
import oidcService from '@intake24/api/services/core/auth/oidc.service';
import { atob } from '@intake24/api/util';
import { User, UserIdentity } from '@intake24/db';

vi.mock('openid-client', () => ({
  discovery: vi.fn(),
  authorizationCodeGrant: vi.fn(),
}));

vi.mock('@intake24/db', () => ({
  User: {
    findOne: vi.fn(),
  },
  UserIdentity: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

const issuer = 'https://idp.example.com';

function mockUser(overrides: Partial<{ email: string | null; verifiedAt: Date | null; disabledAt: Date | null }> = {}) {
  const user = {
    id: '1',
    email: 'owner@example.com',
    verifiedAt: new Date(),
    disabledAt: null,
    ...overrides,
    update: vi.fn(function (this: object, values: object) { Object.assign(this, values); }),
    isVerified() { return !!this.verifiedAt; },
    isDisabled() { return !!this.disabledAt; },
  };
  return user as unknown as User & { update: ReturnType<typeof vi.fn> };
}

function mockClaims(claims: Record<string, unknown>) {
  vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue({
    claims: () => ({ iss: issuer, sub: 'sub-1', ...claims }),
  } as any);
}

describe('oidc callback', () => {
  const transaction = Symbol('transaction');
  const issueTokens = vi.fn();
  const signUp = vi.fn();
  const signup = { enabled: false };

  const service = oidcService({
    aclConfig: { signup },
    appConfig: {
      urls: { admin: 'https://admin.example.com/' },
    },
    adminSignupService: { signUp },
    db: {
      system: {
        transaction: (fn: (t: unknown) => unknown) => fn(transaction),
      },
    },
    jwtService: { issueTokens },
    logger: {
      child: () => ({
        debug: vi.fn(),
      }),
    },
    signInService: {
      log: vi.fn(),
    },
    servicesConfig: {
      oidc: {
        test: { issuer, clientId: 'id', clientSecret: 'secret' },
      },
    },
  } as unknown as IoC);

  const callback = () => service.callback('test', '/oidc/test?code=x', {
    req: {
      ip: '127.0.0.1',
      session: {
        oidc: { provider: 'test', pkce: 'pkce' },
      },
    },
  } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    signup.enabled = false;
    issueTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
  });

  it('signs in the linked user by iss + sub, ignoring the email claim', async () => {
    const user = mockUser();
    vi.mocked(UserIdentity.findOne).mockResolvedValue({ id: '9', user } as any);
    mockClaims({ email: 'attacker@example.com', email_verified: false });

    await callback();

    expect(vi.mocked(UserIdentity.findOne).mock.calls[0][0]?.where).toEqual({ issuer, subject: 'sub-1' });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(UserIdentity.create).not.toHaveBeenCalled();
    const [payload, , { subject }] = issueTokens.mock.calls[0];
    expect(payload.userId).toBe('1');
    expect(atob(subject)).toEqual({ provider: 'oidc', providerKey: 'owner@example.com' });
  });

  it.each([
    [
      'unverified',
      { email: 'owner@example.com', email_verified: false },
    ],
    [
      'missing verification',
      { email: 'owner@example.com' },
    ],
    [
      'missing email',
      { email_verified: true },
    ],
  ])('refuses to link an unknown identity with %s email', async (_, claims) => {
    vi.mocked(UserIdentity.findOne).mockResolvedValue(null);
    mockClaims(claims);

    await expect(callback()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(User.findOne).not.toHaveBeenCalled();
    expect(UserIdentity.create).not.toHaveBeenCalled();
    expect(issueTokens).not.toHaveBeenCalled();
  });

  it('links an unknown identity to the account with a verified matching email', async () => {
    const user = mockUser({ verifiedAt: null });
    vi.mocked(UserIdentity.findOne).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue(user);
    mockClaims({ email: 'Owner@Example.COM', email_verified: true });

    await callback();

    expect(vi.mocked(User.findOne).mock.calls[0][0]?.where).toEqual({ email: 'owner@example.com' });
    expect(UserIdentity.create).toHaveBeenCalledWith({ userId: '1', issuer, subject: 'sub-1' }, { transaction });
    expect(user.update).toHaveBeenCalledWith({
      verifiedAt: expect.any(Date),
    }, { transaction });
    expect(issueTokens.mock.calls[0][0].verified).toBe(true);
  });

  it('refuses a new subject when the account is already linked to the issuer', async () => {
    const user = mockUser({ verifiedAt: null });
    vi.mocked(UserIdentity.findOne)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: '9' } as any);
    vi.mocked(User.findOne).mockResolvedValue(user);
    mockClaims({ sub: 'sub-2', email: 'owner@example.com', email_verified: true });

    await expect(callback()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(vi.mocked(UserIdentity.findOne).mock.calls[1][0]?.where).toEqual({ userId: '1', issuer });
    expect(UserIdentity.create).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
    expect(issueTokens).not.toHaveBeenCalled();
  });

  it.each([
    ['linked', true],
    ['unlinked', false],
  ])('rejects a disabled %s account', async (_, linked) => {
    const user = mockUser({
      disabledAt: new Date(),
    });
    vi.mocked(UserIdentity.findOne).mockResolvedValue(linked
      ? { id: '9', user } as any
      : null);
    vi.mocked(User.findOne).mockResolvedValue(user);
    mockClaims({ email: 'owner@example.com', email_verified: true });

    await expect(callback()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(UserIdentity.create).not.toHaveBeenCalled();
    expect(issueTokens).not.toHaveBeenCalled();
  });

  it('signs up a verified unknown email when signup is enabled', async () => {
    signup.enabled = true;
    vi.mocked(UserIdentity.findOne).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue(null);
    signUp.mockResolvedValue(mockUser({ email: 'new@example.com' }));
    mockClaims({ email: 'New@Example.com', email_verified: true, name: 'New' });

    await callback();

    expect(signUp.mock.calls[0][0]).toMatchObject({
      email: 'new@example.com',
      verifiedAt: expect.any(Date),
    });
    expect(UserIdentity.create).toHaveBeenCalledWith({ userId: '1', issuer, subject: 'sub-1' }, { transaction });
  });
});
