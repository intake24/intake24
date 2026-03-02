/**
 * Locale-aware CSV column resolution for Malaysian and other multi-language locales.
 * Centralizes the mapping from locale IDs to language-specific CSV column names.
 */

/** Malaysian locale → normalized local description column name */
const LOCAL_DESCRIPTION_COLUMNS: Record<string, string> = {
  ms_my: 'local_descriptionmalay',
  zh_my: 'local_descriptionmandarin',
  ta_my: 'local_descriptiontamil',
};

/**
 * Malaysian locale → normalized associated food column name.
 * CSV headers like "Associated Food / Category (Malay)" are normalized
 * to "associated_food__category_malay" by csv-parse (double underscore from "/").
 */
const ASSOCIATED_FOOD_COLUMNS: Record<string, string> = {
  ms_my: 'associated_food__category_malay',
  ta_my: 'associated_food__category_tamil',
  // zh_my (Mandarin) uses the generic column as no specific column exists
};

const DEFAULT_LOCAL_DESCRIPTION_ALIASES = ['local_description', 'local_name'];
const DEFAULT_ASSOCIATED_FOOD_ALIASES = ['associated_food_category', 'associated_food', 'associated_food__category'];

/**
 * Get locale-aware column aliases for local description.
 * For Malaysian locales, prioritizes language-specific columns (e.g. local_descriptionmalay).
 * Falls back to generic local_description/local_name.
 */
export function getLocalDescriptionAliases(localeId: string): string[] {
  const lower = localeId.toLowerCase();
  for (const [prefix, columnName] of Object.entries(LOCAL_DESCRIPTION_COLUMNS)) {
    if (lower.startsWith(prefix)) {
      return [columnName, ...DEFAULT_LOCAL_DESCRIPTION_ALIASES];
    }
  }
  return DEFAULT_LOCAL_DESCRIPTION_ALIASES;
}

/**
 * Get locale-aware column aliases for associated food fields.
 * Malaysian locales have language-specific columns like "Associated Food / Category (Malay)".
 * Falls back to generic associated_food_category.
 */
export function getAssociatedFoodAliases(localeId: string): string[] {
  const lower = localeId.toLowerCase();
  for (const [prefix, columnName] of Object.entries(ASSOCIATED_FOOD_COLUMNS)) {
    if (lower.startsWith(prefix)) {
      return [columnName, ...DEFAULT_ASSOCIATED_FOOD_ALIASES];
    }
  }
  return DEFAULT_ASSOCIATED_FOOD_ALIASES;
}
