import { User } from '@/lib/types';
import { UserRepository } from '../contracts/UserRepository';
import { createClient } from '@/lib/supabase/server';

interface ProfileRow {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  is_blocked?: boolean;
  store_name?: string | null;
  store_description?: string | null;
  business_address?: string | null;
}

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role as User['role'],
    avatar: row.avatar_url,
    createdAt: row.created_at,
    isBlocked: row.is_blocked,
    storeName: row.store_name ?? undefined,
    storeDescription: row.store_description ?? undefined,
    businessAddress: row.business_address ?? undefined,
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
    const payload: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      avatar_url: data.avatar,
    };
    if (data.isBlocked !== undefined) payload.is_blocked = data.isBlocked;

    const { data: row, error } = await supabase
      .from('profiles')
      .insert(payload)
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
    if (data.avatar !== undefined) updatePayload.avatar_url = data.avatar;
    if (data.isBlocked !== undefined) updatePayload.is_blocked = data.isBlocked;
    if (data.storeName !== undefined) updatePayload.store_name = data.storeName;
    if (data.storeDescription !== undefined) updatePayload.store_description = data.storeDescription;
    if (data.businessAddress !== undefined) updatePayload.business_address = data.businessAddress;

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
        phone: isEmail ? null : identifier,
        email: isEmail ? identifier : null,
        role: 'buyer',
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
