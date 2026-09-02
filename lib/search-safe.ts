export function escapeLikeWildcards(value: string): string {
  // Escape LIKE/ILIKE wildcard characters so user input is matched literally.
  // Order matters: escape the backslash first so escaped chars aren't re-processed.
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

export function sanitizeSearchTerm(value: string, maxLength = 100): string {
  return value.slice(0, maxLength).trim();
}

/**
 * Prepare a user-entered search term for a LIKE/ILIKE filter while keeping it
 * safe: escapes wildcards and trims length. Use as `%${safeLike(term)}%`.
 */
export function safeSearchPattern(value: string, maxLength = 100): string {
  const safe = escapeLikeWildcards(value).slice(0, maxLength).trim();
  return `%${safe}%`;
}

/**
 * For PostgREST `.or()` filters, escape characters that break the filter
 * syntax (commas, parentheses), in addition to LIKE wildcards.
 */
export function safeOrTerm(value: string, maxLength = 80): string {
  const escaped = escapeLikeWildcards(value)
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .slice(0, maxLength)
    .trim();
  return escaped;
}
