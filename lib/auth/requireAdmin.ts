import { requireAuth } from './requireAuth';

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.role !== 'admin') throw new Error('Forbidden');
  return session;
}
