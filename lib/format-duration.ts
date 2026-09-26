/**
 * Compact duration formatting for countdowns and quota messaging.
 *
 * "18h 5m" is easier to scan in a narrow dashboard bar than
 * "18 hours 5 minutes", and keeps the text from wrapping on mobile.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'now';

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
