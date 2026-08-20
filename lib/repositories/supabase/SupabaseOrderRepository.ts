import { Order, OrderStatus, OrderItem } from '@/lib/types';
import { OrderRepository } from '../contracts/OrderRepository';
import { createClient } from '@/lib/supabase/server';

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
    items,
    status: row.status as OrderStatus,
    total: row.total,
    createdAt: row.created_at,
    estimatedDelivery: row.estimated_delivery,
    address: row.address,
    paymentMethod: row.payment_method,
  };
}

export class SupabaseOrderRepository implements OrderRepository {
  async create(data: {
    userId: string;
    items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[];
    address: string;
    paymentMethod: string;
    total?: number;
  }): Promise<Order> {
    const supabase = await createClient();

    const total = data.total ?? data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const orderNumber = `EM-${dateStr}-${String((count ?? 0) + 1).padStart(3, '0')}`;

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

    const { data: insertedItems } = await supabase
      .from('order_items')
      .insert(itemRows)
      .select();

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

  async findAll(): Promise<Order[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapOrderRow);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, order_items(*)')
      .single();

    if (error || !data) return null;
    return mapOrderRow(data as OrderRow);
  }

  async cancel(id: string): Promise<Order | null> {
    return this.updateStatus(id, 'cancelled');
  }
}
