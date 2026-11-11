import type { RequestHandler } from 'express';

import type { BucketFactory } from './bucket';

/**
 * Keyed by the user the session's MFA challenge was issued for, so that spreading attempts across
 * IP addresses does not help. Requests without a challenge are not counted, they fail before any
 * code is checked.
 *
 * The key is resolved before the handler runs, so the challenge being removed from the session by
 * the verification itself does not affect which bucket the failure is counted in.
 */
export function mfaVerifyRateLimit(bucket: BucketFactory): RequestHandler {
  return bucket('mfaVerify', {
    key: req => req.session.mfaAuthChallenge?.userId,
    count: 'failures',
    message: 'mfaVerify',
  });
}
