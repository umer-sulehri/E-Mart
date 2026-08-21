import { OrderRepository, NotificationPreferencesRepository } from '@/lib/repositories/index';
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
