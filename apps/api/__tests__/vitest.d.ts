import 'vitest';

// jest-extended only augments the global `jest.Matchers` namespace, which Vitest 5 no longer reads.
declare module 'vitest' {
  // eslint-disable-next-line unused-imports/no-unused-vars -- type parameters must match Vitest's declaration
  interface Matchers<R, T> extends CustomMatchers<R> {}
  interface AsymmetricMatchersContaining extends CustomMatchers<any> {}
}
