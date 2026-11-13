import type { Request, RequestHandler, Response } from 'express';

import type { BucketFactory } from './bucket';
import type { DeviceCookie } from './device-cookie';
import type { IoC } from '@intake24/api/ioc';
import type { FrontEnd } from '@intake24/common/types';

import { deviceCookie } from './device-cookie';
import { ipKey } from './keys';

export const deviceCookieNames: Record<FrontEnd, string> = {
  admin: 'it24a_device',
  survey: 'it24s_device',
};

export type LoginAccount = (req: Request) => string | undefined;

export type LoginRateLimitOptions = {
  bucket: BucketFactory;
  deviceCookie: DeviceCookie;
  cookieName: string;
  account?: LoginAccount;
};

/**
 * A valid device cookie for the account replaces the account and IP buckets with a bucket of its
 * own, so that failures from other clients cannot lock the device out. Once the device bucket is
 * exhausted, the cookie is ignored and the request falls back to the account and IP buckets.
 *
 * A rejected request still counts as a failure in every bucket before the one that rejected it.
 * The IP bucket comes before the account buckets so that, once it is exhausted, new account keys
 * are no longer created in the store.
 */
export function loginRateLimit({ bucket, deviceCookie, cookieName, account }: LoginRateLimitOptions): RequestHandler[] {
  const hasDevice = (req: Request) => req.rateLimitDeviceId !== undefined;

  const resolveDevice: RequestHandler = (req, res, next) => {
    req.rateLimitAccount = account?.(req);
    req.rateLimitDeviceId = req.rateLimitAccount
      ? deviceCookie.find(req.cookies[cookieName], req.rateLimitAccount)
      : undefined;
    next();
  };

  return [
    resolveDevice,
    bucket('loginDevice', {
      key: req => req.rateLimitDeviceId,
      count: 'failures',
      message: 'login',
      onLimitExceeded: (req, res, next) => {
        req.rateLimitDeviceId = undefined;
        next();
      },
    }),
    bucket('loginIp', {
      key: req => ipKey(req),
      skip: hasDevice,
      count: 'failures',
      message: 'login',
    }),
    bucket('loginAccountIp', {
      key: req => req.rateLimitAccount && `${req.rateLimitAccount}:${ipKey(req)}`,
      skip: hasDevice,
      count: 'failures',
      message: 'login',
    }),
    bucket('loginAccount', {
      key: req => req.rateLimitAccount,
      skip: hasDevice,
      count: 'failures',
      message: 'login',
    }),
  ];
}

export function loginRateLimiting(
  frontEnd: FrontEnd,
  { rateLimiter, rateLimiterConfig, appConfig, securityConfig }: Pick<IoC, 'rateLimiter' | 'rateLimiterConfig' | 'appConfig' | 'securityConfig'>,
) {
  const cookieName = deviceCookieNames[frontEnd];
  const { maxAge, maxEntries } = rateLimiterConfig.deviceCookie;
  const { path, sameSite, secure } = securityConfig.jwt[frontEnd].cookie;
  const cookie = deviceCookie({ secret: appConfig.secret, maxAge, maxEntries });

  return {
    middleware: (account?: LoginAccount) => loginRateLimit({
      bucket: rateLimiter.bucket,
      deviceCookie: cookie,
      cookieName,
      account,
    }),
    /**
     * Must only be called once login is fully complete, i.e. tokens are issued, never on a response
     * that still requires MFA or captcha.
     *
     * The account key can only be missing if login succeeded for input that does not fit the
     * database columns, which would mean the key derivation and the login lookup disagree.
     */
    issueDeviceCookie: (req: Request, res: Response, accountKey: string | undefined) => {
      if (accountKey === undefined)
        throw new Error('Device cookie: account key is not available for a successful login.');

      res.cookie(cookieName, cookie.issue(req.cookies[cookieName], accountKey), {
        maxAge,
        httpOnly: true,
        path,
        sameSite,
        secure,
      });
    },
  };
}
