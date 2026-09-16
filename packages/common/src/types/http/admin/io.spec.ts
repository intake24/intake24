import { describe, expect, it } from 'vitest';

import { packageImportRequest, packageVerificationRequest, uploadFileId } from './io';

const validFileId = '0123456789abcdef0123456789abcdef';

describe('uploadFileId', () => {
  it('accepts the TUS 16-byte hexadecimal identifier', () => {
    expect(uploadFileId.safeParse(validFileId).success).toBe(true);
  });

  it.each([
    '../0123456789abcdef0123456789abcdef',
    '01234567-89ab-cdef-0123-456789abcdef',
    '0123456789ABCDEF0123456789ABCDEF',
    '0123456789abcdef0123456789abcde',
  ])('rejects a non-TUS or path-capable identifier: %s', (fileId) => {
    expect(uploadFileId.safeParse(fileId).success).toBe(false);
  });

  it('is applied to verification and import requests', () => {
    expect(packageVerificationRequest.safeParse({
      fileId: '../outside',
      packageFormat: 'intake24',
    }).success).toBe(false);

    expect(packageImportRequest.safeParse({
      fileId: '../outside',
      verificationJobId: 'verification-job',
      options: {
        conflictStrategies: {},
        include: [],
        localeFilter: [],
      },
    }).success).toBe(false);
  });
});
