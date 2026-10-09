/**
 * Query-string transitions shared by the URL-backed admin list tables.
 *
 * These are pure so they can be unit tested without a DOM. The suite is Node
 * only (see `vitest.config.ts`), so a hook that reaches for `useSearchParams`
 * cannot be tested directly — the interesting behaviour is what happens to the
 * query string, and that is what lives here.
 */

/**
 * Applies a set of filter changes to an existing query string.
 *
 * `null` or `''` means "remove this filter", which is how an unset filter and
 * an explicitly cleared one collapse to the same URL.
 *
 * Every change is applied in a single pass. Batching matters: each caller used
 * to rebuild the query from the same stale `searchParams`, so clearing five
 * filters in sequence would let all but the last be dropped when the URL
 * settled — the visible symptom being "Reset All" only clearing one filter.
 */
export function applyFilterPatch(
  currentQuery: string,
  patch: Record<string, string | null>,
): string {
  const params = new URLSearchParams(currentQuery);
  Object.entries(patch).forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  return params.toString();
}

/**
 * A filter or search change invalidates the current page number, since page 4
 * of the previous result set is meaningless against the new one. Callers pass
 * the patched query through this rather than remembering to drop `page`.
 */
export function withInvalidatedPage(query: string): string {
  const params = new URLSearchParams(query);
  params.delete('page');
  return params.toString();
}

/** Full href for a query string, with the bare pathname when there is no query. */
export function hrefWithQuery(pathname: string, query: string): string {
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Single navigation for a filter or search change: patch, drop the stale page,
 * and resolve to an href.
 */
export function filterHref(
  pathname: string,
  currentQuery: string,
  patch: Record<string, string | null>,
): string {
  return hrefWithQuery(pathname, withInvalidatedPage(applyFilterPatch(currentQuery, patch)));
}

/** Every key that currently carries a value, i.e. the active filters. */
export function activeFilterKeys(
  currentQuery: string,
  extraKeys: readonly string[] = [],
): string[] {
  const params = new URLSearchParams(currentQuery);
  return [...params.keys()].filter((key) => !extraKeys.includes(key));
}
