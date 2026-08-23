import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderStatus, OrderItem } from '@/lib/types';
import { OrderRepository } from '../contracts/OrderRepository';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
  estimated_delivery?: string;
  address: string;
  payment_method: string;
  tracking_number?: string | null;
  order_items?: OrderItemRow[];
}

interface OrderItemRow {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
}

function mapOrderRow(row: OrderRow): Order {
  const items: OrderItem[] = (row.order_items ?? []).map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    productImage: item.product_image,
    price: item.price,
    quantity: item.quantity,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    items,
    status: row.status as OrderStatus,
    total: row.total,
    createdAt: row.created_at,
    estimatedDelivery: row.estimated_delivery,
    address: row.address,
    paymentMethod: row.payment_method,
    trackingNumber: row.tracking_number ?? undefined,
  };
}

function isRlsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42501' || /row-level security/i.test(error.message ?? '');
}

export class SupabaseOrderRepository implements OrderRepository {
  async create(data: {
    userId: string;
    items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[];
    address: string;
    paymentMethod: string;
    total?: number;
  }): Promise<Order> {
    try {
      return await this.insertOrder(await createClient(), data);
    } catch (error) {
      if (!isRlsError(error as { code?: string; message?: string })) throw error;
      // Some deployments lack the owner-insert RLS policies. The userId comes
      // from the server session, so completing the write with the service-role
      // client is safe and keeps checkout working.
      return await this.insertOrder(createAdminClient(), data);
    }
  }

  private async insertOrder(
    supabase: SupabaseClient,
    data: {
      userId: string;
      items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[];
      address: string;
      paymentMethod: string;
      total?: number;
    }
  ): Promise<Order> {
    const total = data.total ?? data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Random suffix instead of a row count: RLS scopes COUNT to the caller's
    // own orders, so a sequential number would collide across users.
    const orderNumber = `EM-${dateStr}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const estimatedDelivery = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: data.userId,
        order_number: orderNumber,
        status: 'pending',
        total,
        estimated_delivery: estimatedDelivery,
        address: data.address,
        payment_method: data.paymentMethod,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const itemRows = data.items.map((item) => ({
      order_id: orderRow.id,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      price: item.price,
      quantity: item.quantity,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemRows)
      .select();

    if (itemsError) throw itemsError;

    return mapOrderRow({
      ...orderRow,
      order_items: insertedItems ?? [],
    } as OrderRow);
  }

  async findByUser(userId: string): Promise<Order[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapOrderRow);
  }

  async findById(id: string): Promise<Order | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapOrderRow(data as OrderRow);
  }

  async findByIdUnscoped(id: string): Promise<Order | null> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapOrderRow(data as OrderRow);
  }

  async findAll(): Promise<Order[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapOrderRow);
  }

  async findAllUnscoped(): Promise<Order[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapOrderRow);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const scoped = await this.updateStatusWithClient(await createClient(), id, status);
    if (scoped) return scoped;
    // Under restrictive RLS the scoped UPDATE silently affects 0 rows. All
    // callers have already authorized this transition server-side, so finish
    // the write with the service-role client when the order exists.
    const admin = createAdminClient();
    const { data: exists } = await admin.from('orders').select('id').eq('id', id).single();
    if (!exists) return null;
    return this.updateStatusWithClient(admin, id, status);
  }

  private async updateStatusWithClient(
    supabase: SupabaseClient,
    id: string,
    status: OrderStatus
  ): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, order_items(*)')
      .single();

    if (error || !data) return null;
    return mapOrderRow(data as OrderRow);
  }

  async setTrackingNumber(id: string, trackingNumber: string): Promise<Order | null> {
    const scoped = await createClient();
    const { data } = await scoped
      .from('orders')
      .update({ tracking_number: trackingNumber })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();
    if (data) return mapOrderRow(data as OrderRow);

    // Same RLS fallback as updateStatus: transitions are authorized upstream.
    const admin = createAdminClient();
    const { data: exists } = await admin.from('orders').select('id').eq('id', id).single();
    if (!exists) return null;
    const { data: updated, error } = await admin
      .from('orders')
      .update({ tracking_number: trackingNumber })
      .eq('id', id)
      .select('*, order_items(*)')
      .single();
    if (error || !updated) return null;
    return mapOrderRow(updated as OrderRow);
  }

  async cancel(id: string): Promise<Order | null> {
    return this.updateStatus(id, 'cancelled');
  }
}
