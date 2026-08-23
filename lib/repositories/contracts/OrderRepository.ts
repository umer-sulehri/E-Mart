import { Order, OrderStatus } from '@/lib/types';

export interface OrderRepository {
  create(data: { userId: string; items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[]; address: string; paymentMethod: string; total?: number }): Order | Promise<Order>;
  findByUser(userId: string): Order[] | Promise<Order[]>;
  findById(id: string): Order | null | Promise<Order | null>;
  findByIdUnscoped(id: string): Order | null | Promise<Order | null>;
  findAll(): Order[] | Promise<Order[]>;
  findAllUnscoped(): Order[] | Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Order | null | Promise<Order | null>;
  setTrackingNumber(id: string, trackingNumber: string): Order | null | Promise<Order | null>;
  cancel(id: string): Order | null | Promise<Order | null>;
}
