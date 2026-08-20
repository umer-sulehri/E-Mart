import { User } from '@/lib/types';
import { UserRepository } from '../contracts/UserRepository';
import { createClient } from '@/lib/supabase/server';

interface ProfileRow {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  avatar?: string;
  created_at: string;
  is_blocked?: boolean;
}

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role as User['role'],
    avatar: row.avatar,
    createdAt: row.created_at,
    isBlocked: row.is_blocked,
  };
}

export class SupabaseUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapProfile(data as ProfileRow);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) return null;
    return mapProfile(data as ProfileRow);
  }

  async findByEmail(email: string): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return mapProfile(data as ProfileRow);
  }

  async findByToken(_token: string): Promise<User | null> {
    return null;
  }

  async findAll(): Promise<User[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapProfile);
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from('profiles')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        avatar: data.avatar,
        is_blocked: data.isBlocked ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapProfile(row as ProfileRow);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.avatar !== undefined) updatePayload.avatar = data.avatar;
    if (data.isBlocked !== undefined) updatePayload.is_blocked = data.isBlocked;

    const { data: row, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapProfile(row as ProfileRow);
  }

  async block(id: string): Promise<User> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_blocked: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapProfile(data as ProfileRow);
  }

  async unblock(id: string): Promise<User> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_blocked: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapProfile(data as ProfileRow);
  }

  async findOrCreate(identifier: string): Promise<User> {
    const supabase = await createClient();
    const isEmail = identifier.includes('@');

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .or(isEmail ? `email.eq.${identifier}` : `phone.eq.${identifier}`)
      .single();

    if (existing) return mapProfile(existing as ProfileRow);

    const { data: row, error } = await supabase
      .from('profiles')
      .insert({
        name: isEmail ? identifier.split('@')[0] : `User ${identifier.slice(-4)}`,
        phone: isEmail ? '' : identifier,
        email: isEmail ? identifier : null,
        role: 'buyer',
        is_blocked: false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapProfile(row as ProfileRow);
  }

  async createSession(_userId: string, _role: string): Promise<string> {
    return '';
  }
}
