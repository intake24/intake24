import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { LocalisableError } from '@intake24/api/http/errors';
import { safeResolveUploadedFilePath } from '@intake24/api/jobs/io/import/utils';

describe('resolveUploadedFilePath', () => {
  let testRoot: string;
  let uploadDir: string;

  beforeEach(async () => {
    testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'upload-path-test-'));
    uploadDir = path.join(testRoot, 'uploads');
    await fs.mkdir(uploadDir);
  });

  afterEach(async () => {
    await fs.rm(testRoot, { force: true, recursive: true });
  });

  it('resolves a regular TUS upload directly inside the upload root', async () => {
    const fileId = randomBytes(16).toString('hex');
    const uploadedPath = path.join(uploadDir, fileId);
    await fs.writeFile(uploadedPath, 'package');

    await expect(safeResolveUploadedFilePath(uploadDir, fileId)).resolves.toBe(uploadedPath);
  });

  it('rejects traversal without touching the target file', async () => {
    const target = path.join(testRoot, 'outside');
    await fs.writeFile(target, 'keep');

    await expect(safeResolveUploadedFilePath(uploadDir, '../outside')).rejects.toMatchObject({
      details: { key: 'io.verification.uploadedFileNotAccessible' },
    });
    await expect(fs.readFile(target, 'utf8')).resolves.toBe('keep');
  });

  it('rejects a symlink even when its name is a valid TUS identifier', async () => {
    const target = path.join(testRoot, 'outside');
    const fileId = randomBytes(16).toString('hex');
    await fs.writeFile(target, 'keep');
    await fs.symlink(target, path.join(uploadDir, fileId));

    await expect(safeResolveUploadedFilePath(uploadDir, fileId)).rejects.toBeInstanceOf(LocalisableError);
  });
});
