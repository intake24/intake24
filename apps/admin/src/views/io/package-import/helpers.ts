import type { PackageFileType, PackageImportRequest } from '@intake24/common/types/http/admin';

import axios from 'axios';

import { packageFileTypes } from '@intake24/common/types/http/admin';

export const conflictStrategies = ['skip', 'overwrite', 'abort'] as const;

export type ConflictStrategy = (typeof conflictStrategies)[number];

export type LocalisableMessage = {
  key: string;
  params?: Record<string, unknown>;
};

export type ProblemGroup = {
  file: string;
  messages: LocalisableMessage[];
};

export type ImportOptionsForm = {
  locales: string[];
  include: PackageFileType[];
  conflictStrategies: Partial<Record<PackageFileType, ConflictStrategy>>;
  foodCodes: string;
  categoryCodes: string;
};

/** Pseudo-file the verification job uses for archive-level problems */
export const UPLOADED_FILE = '_uploadedFile';

function isLocalisableMessage(value: unknown): value is LocalisableMessage {
  return !!value && typeof value === 'object' && typeof (value as LocalisableMessage).key === 'string';
}

/**
 * Normalises a job's `errorDetails` into problems grouped by file. Handles:
 * 1. `{ fileErrors: Record<file, { key, params? }[]> }` (PackageValidationFileErrors)
 * 2. `{ key, params? }` (LocalisableError)
 * 3. `{ key, params? }[]` (AggregateLocalisableError)
 * Shapes 2 and 3 are grouped under `fallbackFile`. Returns null when there is nothing
 * localisable (including null details), so the caller can fall back to the job message.
 */
export function normaliseErrorDetails(details: unknown, fallbackFile = UPLOADED_FILE): ProblemGroup[] | null {
  if (!details || typeof details !== 'object')
    return null;

  if ('fileErrors' in details && details.fileErrors && typeof details.fileErrors === 'object') {
    const groups = Object.entries(details.fileErrors as Record<string, unknown>)
      .map(([file, messages]) => ({
        file,
        messages: Array.isArray(messages) ? messages.filter(isLocalisableMessage) : [],
      }))
      .filter(group => group.messages.length > 0);

    return groups.length ? groups : null;
  }

  if (Array.isArray(details)) {
    const messages = details.filter(isLocalisableMessage);
    return messages.length ? [{ file: fallbackFile, messages }] : null;
  }

  return isLocalisableMessage(details) ? [{ file: fallbackFile, messages: [details] }] : null;
}

/** Comma-separated codes: trimmed, empty entries dropped */
export function parseCodeList(value: string): string[] {
  return value.split(',').map(code => code.trim()).filter(code => code.length > 0);
}

/**
 * Import request with an explicit conflict strategy for every included type: the job
 * defaults missing strategies to 'abort', which wouldn't match what the form shows.
 */
export function buildImportRequest(fileId: string, verificationJobId: string, form: ImportOptionsForm): PackageImportRequest {
  const include = packageFileTypes.filter(type => form.include.includes(type));

  return {
    fileId,
    verificationJobId,
    options: {
      include,
      conflictStrategies: Object.fromEntries(include.map(type => [type, form.conflictStrategies[type] ?? 'overwrite'])),
      localeFilter: [...form.locales],
      foodFilter: parseCodeList(form.foodCodes),
      categoryFilter: parseCodeList(form.categoryCodes),
    },
  };
}

const zipMimeTypes = ['application/zip', 'application/x-zip-compressed'];
const zipExtension = /\.zip$/i;

export const zipAccept = ['.zip', ...zipMimeTypes].join(',');

export function isZipFile(file: File) {
  return zipExtension.test(file.name) || zipMimeTypes.includes(file.type);
}

const byteUnits = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

/** Human-readable size in binary units, matching how the server parses its size limit */
export function formatBytes(bytes: number, locale?: string) {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < byteUnits.length - 1) {
    value /= 1024;
    unit++;
  }

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: byteUnits[unit],
    unitDisplay: 'short',
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

/** Best available message for a failed request or other thrown value */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && typeof data.message === 'string')
      return data.message;
  }

  return err instanceof Error ? err.message : String(err);
}
