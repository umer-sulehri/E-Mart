/**
 * Lightweight, SSR-safe analytics helper.
 *
 * Pushes events to the Google tag (gtag.js / dataLayer) when present and
 * silently no-ops otherwise, so it can be called from client components that
 * run below the analytics <script> or in tests.
 */

type TrackParams = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
};

function isClient(): boolean {
  return typeof window !== 'undefined';
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent({ action, category, label, value, ...rest }: TrackParams): void {
  if (!isClient()) return;

  try {
    const event = {
      event: action,
      event_category: category,
      event_label: label,
      value,
      ...rest,
    };

    const w = window as Window & {
      dataLayer?: Array<Record<string, unknown>>;
      gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
    };

    if (typeof w.gtag === 'function') {
      w.gtag('event', action, event);
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push(event);
    }
  } catch {
    // Analytics must never break the calling code.
  }
}

export default trackEvent;