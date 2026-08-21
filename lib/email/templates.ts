export interface EmailTemplateResult {
  subject: string;
  html: string;
}

function layout(title: string, bodyHtml: string, footerNote?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f0;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e6dd;">
        <tr>
          <td style="background:#1a2b1a;padding:20px 32px;">
            <span style="color:#d8ee68;font-size:22px;font-weight:800;letter-spacing:-0.5px;">E-Mart</span>
          </td>
        </tr>
        <tr><td style="padding:32px;color:#222722;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:16px 32px;background:#f4f5f0;color:#6b7269;font-size:12px;line-height:1.5;">
            ${footerNote ?? 'You are receiving this email because you have an E-Mart account.'}<br/>
            &copy; ${new Date().getFullYear()} E-Mart. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderTable(items: { productName: string; quantity: number; price: number }[], total: number): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;color:#222722;">${escapeHtml(i.productName)} &times; ${i.quantity}</td>
        <td style="padding:8px 0;text-align:right;color:#222722;">PKR ${(i.price * i.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4e6dd;margin-top:16px;">
    ${rows}
    <tr>
      <td style="padding:12px 0;border-top:1px solid #e4e6dd;font-weight:700;">Total</td>
      <td style="padding:12px 0;border-top:1px solid #e4e6dd;text-align:right;font-weight:700;">PKR ${total.toLocaleString()}</td>
    </tr>
  </table>`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: { productName: string; quantity: number; price: number }[];
  total: number;
  trackingUrl: string;
}

export function renderOrderConfirmation(data: OrderEmailData): EmailTemplateResult {
  const html = layout(
    'Order Confirmation',
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">Thank you for your order, ${escapeHtml(data.customerName)}!</h2>
     <p>Your order <strong>${escapeHtml(data.orderNumber)}</strong> has been received and is being processed.</p>
     ${orderTable(data.items, data.total)}
     <p style="margin-top:24px;"><a href="${data.trackingUrl}" style="display:inline-block;background:#d8ee68;color:#1a2b1a;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Track your order</a></p>`
  );
  return { subject: `Order confirmation — ${data.orderNumber}`, html };
}

export function renderOrderShipped(data: OrderEmailData): EmailTemplateResult {
  const html = layout(
    'Order Shipped',
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">Your order is on its way!</h2>
     <p>Good news — order <strong>${escapeHtml(data.orderNumber)}</strong> has been shipped and is heading to your address.</p>
     ${orderTable(data.items, data.total)}
     <p style="margin-top:24px;"><a href="${data.trackingUrl}" style="display:inline-block;background:#d8ee68;color:#1a2b1a;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Track package</a></p>`
  );
  return { subject: `Your order ${data.orderNumber} has shipped`, html };
}

export function renderOrderDelivered(data: OrderEmailData): EmailTemplateResult {
  const html = layout(
    'Order Delivered',
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">Delivered!</h2>
     <p>Your order <strong>${escapeHtml(data.orderNumber)}</strong> has been delivered. We hope you love it!</p>
     <p>If anything is not right, you can request a return or exchange from your orders page within 14 days.</p>
     <p style="margin-top:24px;"><a href="${data.trackingUrl}" style="display:inline-block;background:#d8ee68;color:#1a2b1a;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Review your order</a></p>`
  );
  return { subject: `Delivered: order ${data.orderNumber}`, html };
}

export function renderPaymentConfirmation(params: {
  orderNumber: string;
  amount: number;
  method: string;
}): EmailTemplateResult {
  const html = layout(
    'Payment Confirmation',
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">Payment received</h2>
     <p>We have received your payment of <strong>PKR ${params.amount.toLocaleString()}</strong> via <strong>${escapeHtml(params.method)}</strong> for order <strong>${escapeHtml(params.orderNumber)}</strong>.</p>`
  );
  return { subject: `Payment confirmed for order ${params.orderNumber}`, html };
}

export function renderPasswordReset(params: { name: string; code: string }): EmailTemplateResult {
  const html = layout(
    'Password Reset',
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">Password reset requested</h2>
     <p>Hi ${escapeHtml(params.name)}, use the verification code below to reset your password:</p>
     <p style="font-size:28px;font-weight:800;letter-spacing:8px;background:#f4f5f0;padding:16px;text-align:center;border-radius:10px;">${escapeHtml(params.code)}</p>
     <p style="color:#6b7269;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>`
  );
  return { subject: 'Reset your E-Mart password', html };
}

export function renderRefundProcessed(params: { orderNumber: string; amount: number }): EmailTemplateResult {
  const html = layout(
    'Refund Processed',
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">Refund processed</h2>
     <p>A refund of <strong>PKR ${params.amount.toLocaleString()}</strong> for order <strong>${escapeHtml(params.orderNumber)}</strong> has been processed. It should appear in your account within 5-7 business days.</p>`
  );
  return { subject: `Refund processed for order ${params.orderNumber}`, html };
}

export function renderReviewReminder(params: { orderNumber: string; productNames: string[] }): EmailTemplateResult {
  const list = params.productNames.map((n) => `<li>${escapeHtml(n)}</li>`).join('');
  const html = layout(
    'How was your order?',
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">How was everything?</h2>
     <p>Your order <strong>${escapeHtml(params.orderNumber)}</strong> has been delivered. We would love to hear what you think about:</p>
     <ul style="color:#222722;">${list}</ul>
     <p style="margin-top:24px;"><a href="https://e-mart.app/user/reviews" style="display:inline-block;background:#d8ee68;color:#1a2b1a;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Write a review</a></p>`
  );
  return { subject: 'Rate your recent purchase', html };
}

export function renderPromotional(params: { title: string; message: string; ctaUrl: string }): EmailTemplateResult {
  const html = layout(
    params.title,
    `<h2 style="margin:0 0 8px;color:#1a2b1a;">${escapeHtml(params.title)}</h2>
     <p>${escapeHtml(params.message)}</p>
     <p style="margin-top:24px;"><a href="${params.ctaUrl}" style="display:inline-block;background:#d8ee68;color:#1a2b1a;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Shop now</a></p>`,
    'You are receiving promotional emails. Manage preferences in your account settings.'
  );
  return { subject: params.title, html };
}
