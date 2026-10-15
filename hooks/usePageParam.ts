'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { filterHref, pageHref } from '@/lib/urlFilters';

/**
 * Page number held in the URL rather than in React state.
 *
 * The alternative — `useState` plus a fetch effect — silently loses the user's
 * position on refresh, on browser back/forward, and on copy-paste of the URL.
 * `?page=` makes every paginated view shareable and restorable, and it is the
 * only approach where the URL and the rendered rows can never disagree.
 *
 * Requires a `<Suspense>` boundary around the caller: `useSearchParams` opts
 * the whole route out of static rendering, and Next 14 fails the build if that
 * bailout is unsuspended.
 */
export interface UsePageParamOptions {
  /**
   * Values that, when changed, invalidate the current page. Typing in a search
   * box or picking a different filter must return the user to page 1, since
   * page 4 of the old result set is meaningless against the new one.
   *
   * Compared by `Object.is`, so pass primitives (strings, numbers) rather than
   * objects you rebuild on every render.
   */
  resetOn?: readonly unknown[];
  /** Highest addressable page. Used to clamp a stale `?page=` beyond the end. */
  totalPages?: number;
}

export interface UsePageParam {
  /** 1-based page number, already clamped against `totalPages`. */
  page: number;
  /** Navigate to `page`. Clamped, and a no-op when already there. */
  setPage: (page: number) => void;
  /**
   * Serialise these into the query string alongside the rest of the params.
   * Handy for building a "page 1 of the new result set" URL after a reset.
   */
  withPage: (page: number) => string;
}

export function usePageParam({
  resetOn,
  totalPages,
}: UsePageParamOptions = {}): UsePageParam {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = clampPage(readPage(searchParams.get('page')), totalPages);

  // `resetOn` is a fresh array on every render, so it is joined into a stable
  // string key rather than used as an effect dependency directly.
  const resetKey = useMemo(() => serializeResetKey(resetOn), [resetOn]);
  const previousResetKey = useRef(resetKey);

  const replacePage = useCallback(
    (next: number) => {
      const target = clampPage(next, totalPages);
      // `pageHref`, not `filterHref`: a page change must keep the `page` param
      // it is setting (see `pageHref`).
      const href = pageHref(pathname, searchParams.toString(), target);
      router.replace(href, { scroll: false });
    },
    [searchParams, pathname, router, totalPages]
  );

  // Changing a filter or a search term invalidates the page number, so rewrite
  // the URL to page 1. Done as a URL change rather than local state so the
  // browser's own back/forward stack keeps a coherent history.
  useEffect(() => {
    if (previousResetKey.current === resetKey) return;
    previousResetKey.current = resetKey;
    if (readPage(searchParams.get('page')) <= 1) return;

    router.replace(
      filterHref(pathname, searchParams.toString(), { page: null }),
      { scroll: false }
    );
  }, [resetKey, searchParams, pathname, router]);

  const withPage = useCallback(
    (next: number) => {
      const target = clampPage(next, totalPages);
      return pageHref(pathname, searchParams.toString(), target);
    },
    [searchParams, pathname, totalPages]
  );

  return { page, setPage: replacePage, withPage };
}

/**
 * Parses `?page=`, treating anything that is not a positive integer as page 1.
 * `Number` rather than `parseInt` so `?page=2abc` is rejected, not read as 2.
 */
function readPage(raw: string | null): number {
  if (raw === null || raw.trim() === '') return 1;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 1;
  const truncated = Math.trunc(value);
  return truncated >= 1 ? truncated : 1;
}

function clampPage(page: number, totalPages?: number): number {
  if (!totalPages || totalPages < 1) return page;
  return Math.min(page, totalPages);
}

/**
 * Collapses arbitrary reset dependencies into a comparable string. `undefined`,
 * `null` and `''` all serialise to an empty slot so switching a filter between
 * "unset" representations does not look like a change.
 */
function serializeResetKey(values: readonly unknown[] | undefined): string {
  if (!values || values.length === 0) return '';
  return values
    .map((value) => {
      if (value === undefined || value === null || value === '') return '';
      if (Array.isArray(value)) return value.join(',');
      return String(value);
    })
    .join('\u0000');
}
