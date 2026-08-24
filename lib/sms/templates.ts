import { SmsTemplate } from './smsService';

interface OrderSmsData {
  orderNumber: string;
  trackingUrl: string;
}

export function renderOrderConfirmationSms(data: OrderSmsData): string {
  return `E-Mart: Order ${data.orderNumber} confirmed! We are preparing it now. Track: ${data.trackingUrl}`;
}

export function renderOrderShippedSms(data: OrderSmsData): string {
  return `E-Mart: Your order ${data.orderNumber} has shipped and is on its way. Track: ${data.trackingUrl}`;
}

export function renderDeliveryAlertSms(data: OrderSmsData): string {
  return `E-Mart: Your order ${data.orderNumber} is out for delivery today. Please keep your phone reachable.`;
}

export function renderPromotionalSms(message: string): string {
  return `E-Mart: ${message} Reply STOP to opt out.`;
}

export function getSmsTemplate(template: SmsTemplate, data?: OrderSmsData & { code?: string; message?: string }): string {
  switch (template) {
    case 'order_confirmation':
      return data ? renderOrderConfirmationSms(data) : '';
    case 'order_shipped':
      return data ? renderOrderShippedSms(data) : '';
    case 'delivery_alert':
      return data ? renderDeliveryAlertSms(data) : '';
    case 'promotional':
      return data?.message ? renderPromotionalSms(data.message) : '';
  }
}
