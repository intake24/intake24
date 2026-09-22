export interface RebuildPlan {
  /** Locales whose indexes should be built or replaced. */
  build: Set<string>;
  /** Locales whose existing indexes should be discarded because food indexing is no longer enabled. */
  drop: string[];
  /** Requested locales that were skipped because food indexing is not enabled for them. */
  ignored: string[];
}

/**
 * Decides what a rebuild should do. The enabled locale list is authoritative, so a rebuild request cannot
 * override it:
 *
 * - locales that are indexed but no longer enabled are dropped, even if a rebuild was requested for them;
 * - locales that are enabled but not indexed yet are built, even if no rebuild was requested for them;
 * - requested locales that are not enabled are ignored.
 *
 * An undefined `requestedLocales` means "rebuild every enabled locale".
 */
export function planRebuild(
  requestedLocales: string[] | undefined,
  enabledLocales: string[],
  indexedLocales: Iterable<string>,
): RebuildPlan {
  const enabled = new Set(enabledLocales);
  const indexed = new Set(indexedLocales);

  const drop = [...indexed].filter(localeId => !enabled.has(localeId));

  // Locales enabled since the last build have no index yet and must be built regardless of the request.
  const build = new Set(enabledLocales.filter(localeId => !indexed.has(localeId)));
  const ignored = new Array<string>();

  if (requestedLocales === undefined) {
    for (const localeId of enabledLocales) build.add(localeId);

    return { build, drop, ignored };
  }

  for (const localeId of new Set(requestedLocales)) {
    if (enabled.has(localeId))
      build.add(localeId);
    else
      ignored.push(localeId);
  }

  return { build, drop, ignored };
}
