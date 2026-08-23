import { Order, OrderStatus, OrderItem } from '@/lib/types';
import { OrderRepository } from '../contracts/OrderRepository';
import { mockOrders } from '@/lib/mock/orders';

const orders: Order[] = [...mockOrders];
let orderCounter = mockOrders.length;

export class LocalOrderRepository implements OrderRepository {
  create(data: {
    userId: string;
    items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[];
    address: string;
    paymentMethod: string;
    total?: number;
  }): Order {
    orderCounter++;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const orderItems: OrderItem[] = data.items.map((item) => ({
      id: crypto.randomUUID(),
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: item.price,
      quantity: item.quantity,
    }));

    const total = data.total ?? data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const estimatedDelivery = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: `EM-${dateStr}-${String(orderCounter).padStart(3, '0')}`,
      items: orderItems,
      status: 'pending',
      total,
      createdAt: now.toISOString(),
      estimatedDelivery,
      address: data.address,
      paymentMethod: data.paymentMethod,
    };

    orders.push(order);
    return order;
  }

  findByUser(_userId: string): Order[] {
    return [...orders];
  }

  findById(id: string): Order | null {
    return orders.find((o) => o.id === id) ?? null;
  }

  findByIdUnscoped(id: string): Order | null {
    return orders.find((o) => o.id === id) ?? null;
  }

  findAll(): Order[] {
    return [...orders];
  }

  findAllUnscoped(): Order[] {
    return [...orders];
  }

  updateStatus(id: string, status: OrderStatus): Order | null {
    const order = orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    return order;
  }

  cancel(id: string): Order | null {
    const order = orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = 'cancelled';
    return order;
  }
}
