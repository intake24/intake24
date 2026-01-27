import type { JwtPayload, Secret, VerifyOptions } from 'jsonwebtoken';

import jwt from 'jsonwebtoken';

export async function verify<T = JwtPayload>(token: string, secret: Secret, options?: VerifyOptions): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) =>
      err ? reject(err) : resolve(decoded as T | undefined));
  });
}
