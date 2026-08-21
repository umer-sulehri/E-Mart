const API_BASE = '/api/v1';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail =
      data?.message ??
      (typeof data?.error === 'string' ? data.error : null) ??
      `Request failed (HTTP ${res.status})`;
    throw new Error(detail);
  }
  return res.json();
}
