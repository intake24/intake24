import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import type { LocaleRequest, UpdateLocaleRequest } from '@intake24/common/types/http/admin';

export type LocaleTextDirection = 'ltr' | 'rtl';
export type LocaleVisibility = 'public' | 'restricted';

export interface CreateLocaleOptions {
  code: string;
  englishName: string;
  localName: string;
  respondentLanguageId: string;
  adminLanguageId: string;
  countryFlagCode: string;
  prototypeLocaleId?: string | null;
  textDirection?: LocaleTextDirection;
  foodIndexLanguageBackendId?: string;
  foodIndexEnabled?: boolean;
  visibility?: LocaleVisibility;
  overwrite?: boolean;
}

function assertNonEmpty(value: string | undefined, field: string): string {
  if (!value || !value.trim())
    throw new Error(`${field} is required.`);

  return value.trim();
}

function normalisePrototypeLocale(prototype: string | null | undefined): string | null {
  if (!prototype)
    return null;
  const trimmed = prototype.trim();
  return trimmed.length ? trimmed : null;
}

export default async function createLocaleCommand(options: CreateLocaleOptions): Promise<void> {
  const code = assertNonEmpty(options.code, 'Locale code');
  const englishName = assertNonEmpty(options.englishName, 'English name');
  const localName = assertNonEmpty(options.localName, 'Local name');
  const respondentLanguageId = assertNonEmpty(options.respondentLanguageId, 'Respondent language');
  const adminLanguageId = assertNonEmpty(options.adminLanguageId, 'Admin language');
  const countryFlagCode = assertNonEmpty(options.countryFlagCode, 'Country flag code');

  const textDirection: LocaleTextDirection = options.textDirection ?? 'ltr';
  if (!['ltr', 'rtl'].includes(textDirection))
    throw new Error(`Invalid text direction "${textDirection}". Allowed values: "ltr", "rtl".`);

  const visibility: LocaleVisibility = options.visibility ?? 'restricted';
  if (!['public', 'restricted'].includes(visibility))
    throw new Error(`Invalid visibility "${visibility}". Allowed values: "public", "restricted".`);

  const logger = mainLogger.child({ service: 'Create locale' });
  const apiClient = new ApiClientV4(logger, getApiClientV4EnvOptions());

  const localeRequest: LocaleRequest = {
    code,
    englishName,
    localName,
    respondentLanguageId,
    adminLanguageId,
    countryFlagCode,
    prototypeLocaleId: normalisePrototypeLocale(options.prototypeLocaleId ?? null),
    textDirection,
    foodIndexLanguageBackendId: (options.foodIndexLanguageBackendId ?? 'en').trim(),
    foodIndexEnabled: options.foodIndexEnabled ?? false,
    visibility,
  };

  logger.info(`Creating locale "${code}"`);

  const result = await apiClient.locales.create(code, localeRequest);

  if (result.type === 'success') {
    logger.info(`Locale "${code}" created with ID ${result.data.id}`);
    return;
  }

  logger.warn(`Locale "${code}" already exists.`);

  if (!options.overwrite) {
    logger.warn('Re-run with overwrite enabled to update existing locale.');
    return;
  }

  const existing = await apiClient.locales.findByCode(code);
  if (existing === null)
    throw new Error(`Locale "${code}" exists but could not be retrieved for update.`);

  const { code: _omit, ...updatePayload } = localeRequest;
  const updateRequest: UpdateLocaleRequest = updatePayload;

  logger.info(`Updating locale "${code}" (ID: ${existing.id})`);
  await apiClient.locales.update(existing.id, updateRequest);
  logger.info(`Locale "${code}" updated.`);
}
