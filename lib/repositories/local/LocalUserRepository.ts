import { User } from '@/lib/types';
import { UserRepository } from '../contracts/UserRepository';
import { mockUsers } from '@/lib/mock/orders';

const users: User[] = [...mockUsers];
const sessions = new Map<string, { userId: string; role: string }>();

export class LocalUserRepository implements UserRepository {
  findById(id: string): User | null {
    return users.find((u) => u.id === id) ?? null;
  }

  findByPhone(phone: string): User | null {
    return users.find((u) => u.phone === phone) ?? null;
  }

  findByEmail(email: string): User | null {
    return users.find((u) => u.email === email) ?? null;
  }

  findByToken(token: string): User | null {
    const session = sessions.get(token);
    if (!session) return null;
    return this.findById(session.userId);
  }

  findAll(): User[] {
    return [...users];
  }

  create(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    return user;
  }

  update(id: string, data: Partial<User>): User {
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return user;
  }

  block(id: string): User {
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.isBlocked = true;
    return user;
  }

  unblock(id: string): User {
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.isBlocked = false;
    return user;
  }

  findOrCreate(identifier: string): User {
    const existing = users.find(
      (u) => u.phone === identifier || u.email === identifier
    );
    if (existing) return existing;

    const isEmail = identifier.includes('@');
    const user: User = {
      id: crypto.randomUUID(),
      name: isEmail ? identifier.split('@')[0] : `User ${identifier.slice(-4)}`,
      phone: isEmail ? '' : identifier,
      email: isEmail ? identifier : undefined,
      role: 'buyer',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    return user;
  }

  createSession(userId: string, role: string): string {
    const token = Buffer.from(
      JSON.stringify({ userId, role, iat: Date.now() })
    ).toString('base64');
    sessions.set(token, { userId, role });
    return token;
  }
}
