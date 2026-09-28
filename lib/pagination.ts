/**
 * Shared pagination primitives for every list endpoint and list view.
 *
 * The same three lines of `parseInt` / `.range()` / `Math.ceil` were copy-pasted
 * into roughly thirty route handlers, and had already drifted: one route clamps
 * its limit, one emits snake_case meta, one derives `totalPages` from the
 * post-filter row count. Centralising the parsing and the meta shape is what
 * keeps a paginated table honest, so this module stays framework-free and is
 * unit tested directly.
 */

import type { PaginationMeta } from '@/types';

export interface PaginationBounds {
  /** The page being requested, always `>= 1`. */
  page: number;
  /** The clamped page size. */
  limit: number;
  /** PostgREST `.range()` start, always `>= 0`. */
  offset: number;
}

export interface PaginationOptions {
  /** Page size used when the request omits `limit`. Defaults to 20. */
  defaultLimit?: number;
  /**
   * Hard ceiling on `limit`. Uncapped `limit` is a trivial way for a client to
   * ask for the whole table, so every endpoint should pass one. Defaults to 100.
   */
  maxLimit?: number;
  /** Lowest page size the caller is allowed to request. Defaults to 1. */
  minLimit?: number;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

/**
 * Upper bound on the requested page number. Without it `?page=1e9` produces a
 * `.range()` offset large enough to be a denial-of-service vector against
 * Postgres' row-counting plan. Real tables are nowhere near this many pages.
 */
export const MAX_PAGE = 100_000;

/**
 * Reads `?page=` and `?limit=` out of `URLSearchParams`, falling back to the
 * supplied defaults and rejecting anything that is not a usable positive
 * integer.
 *
 * A tampered query string must never reach `.range()`: a negative offset is a
 * PostgREST error, and an unbounded limit is a full table scan.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): PaginationBounds {
  const {
    defaultLimit = DEFAULT_PAGE_LIMIT,
    maxLimit = MAX_PAGE_LIMIT,
    minLimit = 1,
  } = options;

  const limit = clamp(
    parseIntOrNull(searchParams.get('limit')) ?? defaultLimit,
    minLimit,
    maxLimit
  );
  const page = clamp(parseIntOrNull(searchParams.get('page')) ?? 1, 1, MAX_PAGE);

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Builds the `meta` block every list endpoint returns.
 *
 * `totalPages` is floored at 1 so an empty result set reports "page 1 of 1"
 * rather than "page 1 of 0", which would render a paginator with a single dead
 * control.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  const safeLimit = limit > 0 ? limit : 1;
  const total = totalItems || 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: safeLimit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * The 1-based index of the first row on `page`, for "Showing 11-20 of 57".
 * Returns 0 when there is nothing to show.
 */
export function pageRangeStart(
  page: number,
  limit: number,
  totalItems: number
): number {
  if (totalItems <= 0) return 0;
  return (Math.max(1, page) - 1) * (limit > 0 ? limit : 1) + 1;
}

/** The 1-based index of the last row on `page`, clamped to `totalItems`. */
export function pageRangeEnd(
  page: number,
  limit: number,
  totalItems: number
): number {
  if (totalItems <= 0) return 0;
  const start = pageRangeStart(page, limit, totalItems);
  return Math.min(start + (limit > 0 ? limit : 1) - 1, totalItems);
}

/**
 * Parses a query-string integer, returning `null` for anything unusable:
 * absent, blank, non-numeric, non-finite, or a partially numeric value like
 * `"12abc"` that `parseInt` would happily truncate to 12.
 */
function parseIntOrNull(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.trunc(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
