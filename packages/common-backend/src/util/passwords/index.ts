import PasswordBcrypt from './password-bcrypt';
import PasswordShiro from './password-shiro';

export { default as PasswordBcrypt } from './password-bcrypt';
export { default as PasswordShiro } from './password-shiro';

export interface HashedPassword {
  hash: string;
  salt: string;
}

export interface PasswordAlgorithm {
  readonly id: string;

  hash: (password: string) => Promise<HashedPassword>;

  verify: (input: string, hashedPassword: HashedPassword) => Promise<boolean>;
}

// FIXME: Should be configurable using dependency injection, not sure how to do that properly
//        yet -- Ivan

export const supportedAlgorithms = [
  new PasswordBcrypt(),
  new PasswordShiro(),
];

export const defaultAlgorithm = new PasswordBcrypt();
