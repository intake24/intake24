import type { RequestHandler } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

import type { BucketFactory } from './bucket';

import jwt from 'jsonwebtoken';
import { ExtractJwt } from 'passport-jwt';

import { ipKey } from './keys';

const extractToken = ExtractJwt.fromAuthHeaderAsBearerToken();

/**
 * Generic limits run before passport, so the access token is verified here to pick the per-user
 * bucket. Verification must not be skipped: an unverified token would let anyone pick arbitrary
 * user ids and get a fresh bucket for each. Invalid tokens fall back to the anonymous bucket and
 * are rejected later by passport.
 */
export function identifyRateLimitUser({ secret, issuer }: { secret: string; issuer: string }): RequestHandler {
  return (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
      next();
      return;
    }

    let payload: JwtPayload | undefined;
    try {
      const verified = jwt.verify(token, secret, { issuer, audience: 'access' });
      payload = typeof verified === 'string'
        ? undefined
        : verified;
    }
    catch {
      payload = undefined;
    }

    const audience = Array.isArray(payload?.aud)
      ? payload.aud
      : [];
    const frontEnd = audience.includes('admin')
      ? 'admin'
      : audience.includes('survey')
        ? 'survey'
        : undefined;
    if (frontEnd && typeof payload?.userId === 'string')
      req.rateLimitUser = { userId: payload.userId, frontEnd };

    next();
  };
}

export function genericRateLimit(bucket: BucketFactory, jwtOptions: { secret: string; issuer: string }): RequestHandler[] {
  return [
    identifyRateLimitUser(jwtOptions),
    bucket('genericAnonymous', {
      key: req => req.rateLimitUser
        ? undefined
        : ipKey(req),
      count: 'all',
      message: 'generic',
    }),
    bucket('genericSurveyUser', {
      key: req => req.rateLimitUser?.frontEnd === 'survey'
        ? req.rateLimitUser.userId
        : undefined,
      count: 'all',
      message: 'generic',
    }),
    bucket('genericAdminUser', {
      key: req => req.rateLimitUser?.frontEnd === 'admin'
        ? req.rateLimitUser.userId
        : undefined,
      count: 'all',
      message: 'generic',
    }),
  ];
}
