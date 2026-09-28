import { describe, it, expect } from 'vitest';
import {
  parsePagination,
  buildPaginationMeta,
  pageRangeStart,
  pageRangeEnd,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  MAX_PAGE,
} from '../pagination';

function params(query = ''): URLSearchParams {
  return new URLSearchParams(query);
}

describe('parsePagination', () => {
  it('defaults to page 1 with the default limit', () => {
    expect(parsePagination(params())).toEqual({
      page: 1,
      limit: DEFAULT_PAGE_LIMIT,
      offset: 0,
    });
  });

  it('derives the offset from the page and limit', () => {
    expect(parsePagination(params('page=3&limit=15'))).toEqual({
      page: 3,
      limit: 15,
      offset: 30,
    });
  });

  it('clamps the limit to the maximum', () => {
    expect(parsePagination(params('limit=10000')).limit).toBe(MAX_PAGE_LIMIT);
  });

  it('honours a per-endpoint default limit', () => {
    expect(parsePagination(params(), { defaultLimit: 10 }).limit).toBe(10);
    expect(parsePagination(params('page=2'), { defaultLimit: 10 }).offset).toBe(10);
  });

  it('honours a per-endpoint maximum limit', () => {
    expect(parsePagination(params('limit=500'), { maxLimit: 50 }).limit).toBe(50);
  });

  it('never lets the limit fall below the minimum', () => {
    expect(parsePagination(params('limit=0'), { minLimit: 5 }).limit).toBe(5);
  });

  it('falls back to the default for non-numeric values', () => {
    expect(parsePagination(params('page=abc')).page).toBe(1);
    expect(parsePagination(params('limit=abc')).limit).toBe(DEFAULT_PAGE_LIMIT);
  });

  it('rejects a partially numeric page rather than reading its prefix', () => {
    // parseInt('2abc') is 2, which would silently serve the wrong page.
    expect(parsePagination(params('page=2abc')).page).toBe(1);
  });

  it('falls back to page 1 for zero, negative and non-finite values', () => {
    expect(parsePagination(params('page=0')).page).toBe(1);
    expect(parsePagination(params('page=-5')).page).toBe(1);
    expect(parsePagination(params('page=NaN')).page).toBe(1);
    expect(parsePagination(params('page=Infinity')).page).toBe(1);
  });

  it('truncates a fractional page rather than rounding it', () => {
    expect(parsePagination(params('page=2.9')).page).toBe(2);
  });

  it('treats an empty value as absent', () => {
    expect(parsePagination(params('page=')).page).toBe(1);
    expect(parsePagination(params('limit=')).limit).toBe(DEFAULT_PAGE_LIMIT);
  });

  it('caps an absurd page so the offset cannot be used as a DoS vector', () => {
    expect(parsePagination(params('page=1e9')).page).toBe(MAX_PAGE);
  });

  it('treats an empty limit as absent rather than as zero', () => {
    const { limit } = parsePagination(params('page=2&limit='));
    expect(limit).toBe(DEFAULT_PAGE_LIMIT);
  });
});

describe('buildPaginationMeta', () => {
  it('reports a full result set', () => {
    expect(buildPaginationMeta(2, 10, 57)).toEqual({
      currentPage: 2,
      totalPages: 6,
      totalItems: 57,
      itemsPerPage: 10,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('reports no next page on the last page', () => {
    const meta = buildPaginationMeta(6, 10, 57);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('reports no previous page on the first page', () => {
    const meta = buildPaginationMeta(1, 10, 57);
    expect(meta.hasPreviousPage).toBe(false);
    expect(meta.hasNextPage).toBe(true);
  });

  it('reports a single page when everything fits', () => {
    expect(buildPaginationMeta(1, 20, 7)).toMatchObject({
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('never reports zero pages for an empty result set', () => {
    // "Page 1 of 0" would render a paginator with one dead control.
    const meta = buildPaginationMeta(1, 20, 0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
    expect(meta.totalItems).toBe(0);
  });

  it('rounds a partial final page up', () => {
    expect(buildPaginationMeta(1, 10, 20).totalPages).toBe(2);
  });

  it('survives a zero limit without dividing by zero', () => {
    const meta = buildPaginationMeta(1, 0, 12);
    expect(meta.itemsPerPage).toBe(1);
    expect(meta.totalPages).toBe(12);
  });
});

describe('page range', () => {
  it('reports the first page from 1', () => {
    expect(pageRangeStart(1, 10, 57)).toBe(1);
    expect(pageRangeEnd(1, 10, 57)).toBe(10);
  });

  it('reports a middle page', () => {
    expect(pageRangeStart(3, 10, 57)).toBe(21);
    expect(pageRangeEnd(3, 10, 57)).toBe(30);
  });

  it('clamps the end of the final page to the total', () => {
    expect(pageRangeStart(6, 10, 57)).toBe(51);
    expect(pageRangeEnd(6, 10, 57)).toBe(57);
  });

  it('reports nothing for an empty result set', () => {
    expect(pageRangeStart(1, 10, 0)).toBe(0);
    expect(pageRangeEnd(1, 10, 0)).toBe(0);
  });

  it('never reports a start beyond the total on a stale page', () => {
    // A `?page=99` against a 3-page result set must not print "91-0 of 12".
    expect(pageRangeEnd(99, 10, 12)).toBe(12);
  });
});
