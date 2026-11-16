import { parseOidcConfig } from '@intake24/api/config/services';

describe('parseOidcConfig', () => {
  it('groups provider vars, lower-cases names and allows underscores', () => {
    expect(parseOidcConfig({
      OIDC_GOOGLE_ISSUER: 'https://accounts.google.com',
      OIDC_GOOGLE_CLIENT_ID: 'gid',
      OIDC_GOOGLE_CLIENT_SECRET: 'gsecret',
      OIDC_MY_IDP_CLIENT_ID: 'mid',
      OIDC_EMPTY_ISSUER: '',
      OIDC_EMPTY_CLIENT_ID: '',
      OIDC_UNKNOWN: 'ignored',
      OTHER_VAR: 'ignored',
    })).toEqual({
      google: { issuer: 'https://accounts.google.com', clientId: 'gid', clientSecret: 'gsecret' },
      my_idp: { clientId: 'mid' },
    });
  });
});
