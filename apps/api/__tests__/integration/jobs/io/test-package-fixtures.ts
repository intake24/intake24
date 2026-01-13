import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { zipDirectory } from '@intake24/api/util/files';

export interface TestPackageOptions {
  includePackageJson?: boolean;
  packageJsonContent?: object | string;
  includeFoods?: boolean;
  foodsContent?: object | string;
  includeCategories?: boolean;
  categoriesContent?: object | string;
  corrupt?: boolean;
}

export async function createTestPackage(options: TestPackageOptions = {}): Promise<string> {
  const fileId = randomUUID();
  const uploadDir = path.join(os.tmpdir(), 'large-file-uploads');
  const filePath = path.join(uploadDir, fileId);

  await fs.mkdir(uploadDir, { recursive: true });

  if (options.corrupt) {
    await fs.writeFile(filePath, 'this is not a valid zip file content');
    return fileId;
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-package-'));

  try {
    if (options.packageJsonContent !== undefined) {
      const content = typeof options.packageJsonContent === 'string'
        ? options.packageJsonContent
        : JSON.stringify(options.packageJsonContent);
      await fs.writeFile(path.join(tempDir, 'package.json'), content);
    }
    else if (options.includePackageJson !== false) {
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({ version: '2.0', format: 'json' }));
    }

    if (options.foodsContent !== undefined) {
      const content = typeof options.foodsContent === 'string'
        ? options.foodsContent
        : JSON.stringify(options.foodsContent);
      await fs.writeFile(path.join(tempDir, 'foods.json'), content);
    }
    else if (options.includeFoods) {
      await fs.writeFile(path.join(tempDir, 'foods.json'), JSON.stringify({}));
    }

    if (options.categoriesContent !== undefined) {
      const content = typeof options.categoriesContent === 'string'
        ? options.categoriesContent
        : JSON.stringify(options.categoriesContent);
      await fs.writeFile(path.join(tempDir, 'categories.json'), content);
    }
    else if (options.includeCategories) {
      await fs.writeFile(path.join(tempDir, 'categories.json'), JSON.stringify({}));
    }

    await zipDirectory(tempDir, filePath);
  }
  finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  return fileId;
}

export async function cleanupTestPackage(fileId: string): Promise<void> {
  const uploadDir = path.join(os.tmpdir(), 'large-file-uploads');
  const filePath = path.join(uploadDir, fileId);
  const extractedPath = path.join(os.tmpdir(), 'i24-pkg-import-', fileId);

  await fs.rm(filePath, { force: true });
  await fs.rm(extractedPath, { recursive: true, force: true });
}

export function createValidEmptyPackage(): Promise<string> {
  return createTestPackage({
    includePackageJson: true,
  });
}

export function createCorruptedPackage(): Promise<string> {
  return createTestPackage({
    corrupt: true,
  });
}

export function createMissingPackageJsonPackage(): Promise<string> {
  return createTestPackage({
    includePackageJson: false,
    includeFoods: true, // Need at least one file for a valid zip
  });
}

export function createMalformedPackageJsonPackage(): Promise<string> {
  return createTestPackage({
    packageJsonContent: '{ invalid json content',
  });
}

export function createInvalidSchemaPackageJsonPackage(): Promise<string> {
  return createTestPackage({
    packageJsonContent: { wrongField: 'wrong value' },
  });
}

export function createInvalidFoodsPackage(): Promise<string> {
  return createTestPackage({
    includePackageJson: true,
    foodsContent: '{ invalid json',
  });
}
