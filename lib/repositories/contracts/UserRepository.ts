import { User } from '@/lib/types';

export interface UserRepository {
  findById(id: string): User | null | Promise<User | null>;
  findByPhone(phone: string): User | null | Promise<User | null>;
  findByEmail(email: string): User | null | Promise<User | null>;
  findByToken(token: string): User | null | Promise<User | null>;
  findAll(): User[] | Promise<User[]>;
  create(data: Omit<User, 'id' | 'createdAt'>): User | Promise<User>;
  update(id: string, data: Partial<User>): User | Promise<User>;
  block(id: string): User | Promise<User>;
  unblock(id: string): User | Promise<User>;
  findOrCreate(identifier: string): User | Promise<User>;
  createSession(userId: string, role: string): string | Promise<string>;
}
