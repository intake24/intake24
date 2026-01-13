import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Job as BullJob } from 'bullmq';
import { vi } from 'vitest';

import { LocalisableError } from '@intake24/api/http/errors';
import ioc from '@intake24/api/ioc';
import { PackageValidationFileErrors } from '@intake24/api/jobs/io/package-handlers/types';
import { Job as DbJob, Permission, User } from '@intake24/db';

import {
  cleanupTestPackage,
  createCorruptedPackage,
  createInvalidFoodsPackage,
  createInvalidSchemaPackageJsonPackage,
  createMalformedPackageJsonPackage,
  createMissingPackageJsonPackage,
  createValidEmptyPackage,
} from './test-package-fixtures';

export default () => {
  let testUser: User;
  let packageImportPermission: Permission;

  beforeAll(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      simpleName: 'test user',
    });

    [packageImportPermission] = await Permission.findOrCreate({
      where: { name: 'import-package' },
      defaults: {
        name: 'import-package',
        displayName: 'Import Package',
        description: 'Permission to import packages',
      },
    });
  });

  afterAll(async () => {
    if (testUser)
      await testUser.destroy();
  });

  const createMockBullJob = (dbJobId: string, params: { fileId: string; packageFormat: string }): BullJob => {
    return {
      id: `db-${dbJobId}`,
      data: { params },
      updateProgress: vi.fn(),
      returnvalue: null,
    } as unknown as BullJob;
  };

  const createDbJob = async (userId: string, params: { fileId: string; packageFormat: string }): Promise<DbJob> => {
    return DbJob.create({
      type: 'PackageVerification',
      userId,
      params,
    });
  };

  describe('valid package', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createValidEmptyPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });

      // Grant permission
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      await cleanupTestPackage(fileId);
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should complete successfully with a valid package', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      await expect(job.run(mockBullJob)).resolves.not.toThrow();

      // Verify extracted files exist
      const extractedPath = path.join(os.tmpdir(), `i24-pkg-import-${fileId}`);
      await expect(fs.stat(extractedPath)).resolves.toBeDefined();
    });
  });

  describe('invalid zip file', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createCorruptedPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      await cleanupTestPackage(fileId);
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should throw error for corrupted zip file', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      try {
        await job.run(mockBullJob);
        expect.fail('Expected job to throw');
      }
      catch (error) {
        expect(error).toBeInstanceOf(PackageValidationFileErrors);
        expect((error as PackageValidationFileErrors).details.fileErrors).toHaveProperty('_uploadedFile');
      }
    });
  });

  describe('missing package.json', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createMissingPackageJsonPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      await cleanupTestPackage(fileId);
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should throw error for missing package.json', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      try {
        await job.run(mockBullJob);
        expect.fail('Expected job to throw');
      }
      catch (error) {
        expect(error).toBeInstanceOf(PackageValidationFileErrors);
        const fileError = (error as PackageValidationFileErrors).details.fileErrors._uploadedFile?.[0];
        expect(fileError?.key).toBe('io.verification.packageJsonNotFound');
      }
    });
  });

  describe('malformed package.json', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createMalformedPackageJsonPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      await cleanupTestPackage(fileId);
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should throw error for malformed package.json', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      try {
        await job.run(mockBullJob);
        expect.fail('Expected job to throw');
      }
      catch (error) {
        expect(error).toBeInstanceOf(PackageValidationFileErrors);
        const fileError = (error as PackageValidationFileErrors).details.fileErrors._uploadedFile?.[0];
        expect(fileError?.key).toBe('io.verification.invalidJsonSyntax');
      }
    });
  });

  describe('invalid package.json schema', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createInvalidSchemaPackageJsonPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      await cleanupTestPackage(fileId);
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should throw validation error for invalid package.json schema', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      try {
        await job.run(mockBullJob);
        expect.fail('Expected job to throw');
      }
      catch (error) {
        expect(error).toBeInstanceOf(PackageValidationFileErrors);
        const fileError = (error as PackageValidationFileErrors).details.fileErrors._uploadedFile?.[0];
        expect(fileError?.key).toBe('io.verification.zodError');
      }
    });
  });

  describe('missing permissions', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createValidEmptyPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });
      // Note: NOT granting import-package permission
    });

    afterEach(async () => {
      await cleanupTestPackage(fileId);
      if (dbJob)
        await dbJob.destroy();
    });

    it('should throw error when user lacks import-package permission', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      try {
        await job.run(mockBullJob);
        expect.fail('Expected job to throw');
      }
      catch (error) {
        expect(error).toBeInstanceOf(LocalisableError);
        expect((error as LocalisableError).details.key).toBe('io.verification.importPermission');
      }
    });
  });

  describe('missing uploaded file', () => {
    let dbJob: DbJob;
    const nonExistentFileId = 'non-existent-file-id-12345';

    beforeEach(async () => {
      dbJob = await createDbJob(testUser.id, { fileId: nonExistentFileId, packageFormat: 'intake24' });
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should throw error when uploaded file does not exist', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId: nonExistentFileId, packageFormat: 'intake24' });

      try {
        await job.run(mockBullJob);
        expect.fail('Expected job to throw');
      }
      catch (error) {
        expect(error).toBeInstanceOf(LocalisableError);
        expect((error as LocalisableError).details.key).toBe('io.verification.uploadedFileNotAccessible');
      }
    });
  });

  describe('invalid foods.json', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createInvalidFoodsPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      await cleanupTestPackage(fileId);
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should throw validation error for invalid foods.json', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      try {
        await job.run(mockBullJob);
        expect.fail('Expected job to throw');
      }
      catch (error) {
        expect(error).toBeInstanceOf(PackageValidationFileErrors);
        expect((error as PackageValidationFileErrors).details.fileErrors).toHaveProperty('foods.json');
      }
    });
  });

  describe('cleanup on failure', () => {
    let fileId: string;
    let dbJob: DbJob;

    beforeEach(async () => {
      fileId = await createInvalidSchemaPackageJsonPackage();
      dbJob = await createDbJob(testUser.id, { fileId, packageFormat: 'intake24' });
      await testUser.$add('permissions', packageImportPermission);
    });

    afterEach(async () => {
      // Uploaded file should be deleted by the job
      // Just clean up extracted path in case
      const extractedPath = path.join(os.tmpdir(), `i24-pkg-import-${fileId}`);
      await fs.rm(extractedPath, { recursive: true, force: true }).catch(() => {});
      if (dbJob)
        await dbJob.destroy();
      await testUser.$remove('permissions', packageImportPermission);
    });

    it('should delete uploaded file on failure', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      const uploadedPath = path.join(os.tmpdir(), 'large-file-uploads', fileId);

      // Verify file exists before
      await expect(fs.stat(uploadedPath)).resolves.toBeDefined();

      // Run job (should fail)
      await expect(job.run(mockBullJob)).rejects.toBeInstanceOf(PackageValidationFileErrors);

      // Verify file is deleted after
      await expect(fs.stat(uploadedPath)).rejects.toThrow();
    });

    it('should delete extracted files on validation failure', async () => {
      const job = ioc.resolve('PackageVerification');
      const mockBullJob = createMockBullJob(dbJob.id, { fileId, packageFormat: 'intake24' });

      const extractedPath = path.join(os.tmpdir(), `i24-pkg-import-${fileId}`);

      // Run job (should fail)
      await expect(job.run(mockBullJob)).rejects.toBeInstanceOf(PackageValidationFileErrors);

      // Extracted path should be removed on failure
      await expect(fs.stat(extractedPath)).rejects.toThrow();
    });
  });
};
