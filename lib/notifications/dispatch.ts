import { OrderRepository, NotificationPreferencesRepository } from '@/lib/repositories/index';
import { getOptionalSupabase } from '@/lib/supabase/optional';
import { User } from '@/lib/types';
import { sendEmail } from '@/lib/email/emailService';
import {
  renderOrderConfirmation,
  renderOrderShipped,
  renderOrderDelivered,
  renderPaymentConfirmation,
  renderRefundProcessed,
} from '@/lib/email/templates';
import { sendSms } from '@/lib/sms/smsService';
import { getSmsTemplate } from '@/lib/sms/templates';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderLike {
  id: string;
  orderNumber: string;
  total: number;
  items: { productName: string; quantity: number; price: number }[];
}

function trackingUrl(orderId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-mart.app';
  return `${base}/user/orders/${orderId}`;
}

async function getPreferences(userId: string): Promise<{ email: boolean; sms: boolean; promotions: boolean }> {
  try {
    const prefs = await NotificationPreferencesRepository.get(userId);
    const record = prefs as { emailNotifications?: boolean; smsNotifications?: boolean; promotions?: boolean } | undefined;
    return {
      email: record?.emailNotifications ?? true,
      sms: record?.smsNotifications ?? record?.emailNotifications ?? true,
      promotions: record?.promotions ?? false,
    };
  } catch {
    return { email: true, sms: true, promotions: false };
  }
}

const STATUS_COPY: Record<Exclude<OrderStatus, 'pending'>, { title: string; message: (n: string) => string }> = {
  confirmed: { title: 'Order Confirmed', message: (n) => `Order #${n} has been confirmed and is being prepared.` },
  processing: { title: 'Order Processing', message: (n) => `Order #${n} is being prepared for shipment.` },
  shipped: { title: 'Order Shipped', message: (n) => `Order #${n} has shipped and is on its way.` },
  delivered: { title: 'Order Delivered', message: (n) => `Order #${n} has been delivered. Enjoy!` },
  cancelled: { title: 'Order Cancelled', message: (n) => `Order #${n} was cancelled. Any payment will be refunded.` },
};

/** Best-effort insert of an in-app feed row into the notifications table. */
async function insertInAppNotification(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: OrderStatus
): Promise<void> {
  try {
    const supabase = await getOptionalSupabase();
    if (!supabase || status === 'pending') return;

    const copy = STATUS_COPY[status];
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'order',
      title: copy.title,
      message: copy.message(orderNumber),
      link: `/user/orders/${orderId}`,
    });
  } catch {
    // Feed insert failures must never break the dispatch flow.
  }
}

/**
 * Fire-and-forget notifications for an order status transition.
 * Never throws — notification failures must not break checkout or admin flows.
 */
export async function dispatchOrderStatusNotifications(
  user: User,
  order: OrderLike,
  status: OrderStatus
): Promise<void> {
  try {
    await insertInAppNotification(user.id, order.id, order.orderNumber, status);

    const prefs = await getPreferences(user.id);
    const url = trackingUrl(order.id);

    const tasks: Promise<unknown>[] = [];

    if (prefs.email && user.email) {
      switch (status) {
        case 'confirmed':
          tasks.push(
            sendEmail({
              to: user.email,
              userId: user.id,
              template: 'order_confirmation',
              ...renderOrderConfirmation({
                orderNumber: order.orderNumber,
                customerName: user.name ?? 'Customer',
                items: order.items,
                total: order.total,
                trackingUrl: url,
              }),
            })
          );
          break;
        case 'processing':
          tasks.push(
            sendEmail({
              to: user.email,
              userId: user.id,
              template: 'payment_confirmation',
              ...renderPaymentConfirmation({ orderNumber: order.orderNumber, amount: order.total, method: 'online' }),
            })
          );
          break;
        case 'shipped':
          tasks.push(
            sendEmail({
              to: user.email,
              userId: user.id,
              template: 'order_shipped',
              ...renderOrderShipped({
                orderNumber: order.orderNumber,
                customerName: user.name ?? 'Customer',
                items: order.items,
                total: order.total,
                trackingUrl: url,
              }),
            })
          );
          break;
        case 'delivered':
          tasks.push(
            sendEmail({
              to: user.email,
              userId: user.id,
              template: 'order_delivered',
              ...renderOrderDelivered({
                orderNumber: order.orderNumber,
                customerName: user.name ?? 'Customer',
                items: order.items,
                total: order.total,
                trackingUrl: url,
              }),
            })
          );
          break;
        case 'cancelled':
          tasks.push(
            sendEmail({
              to: user.email,
              userId: user.id,
              template: 'refund_processed',
              ...renderRefundProcessed({ orderNumber: order.orderNumber, amount: order.total }),
            })
          );
          break;
        default:
          break;
      }
    }

    if (prefs.sms && user.phone) {
      const message = getSmsTemplate(
        status === 'delivered' ? 'delivery_alert' : status === 'shipped' ? 'order_shipped' : 'order_confirmation',
        { orderNumber: order.orderNumber, trackingUrl: url }
      );
      if (message) {
        tasks.push(sendSms({ to: user.phone, message, template: 'order_confirmation', userId: user.id }));
      }
    }

    await Promise.allSettled(tasks);
  } catch {
    // Swallow all notification errors by design.
  }
}

/** Convenience wrapper used right after a new order is created. */
export async function notifyNewOrder(user: User, orderId: string): Promise<void> {
  try {
    const order = await OrderRepository.findById(orderId);
    if (!order) return;
    await dispatchOrderStatusNotifications(user, order, 'confirmed');
  } catch {
    // Ignore.
  }
}
