const BASE_COLOR = "#6BB252";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${BASE_COLOR};padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">E-Mart</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:#364127;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:13px;">&copy; ${new Date().getFullYear()} E-Mart. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cta(url: string, label: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${escapeHtml(url)}" style="display:inline-block;background:${BASE_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">${escapeHtml(label)}</a>
  </p>`;
}

export function orderConfirmationEmail(data: {
  name: string;
  orderNumber: string;
  total: number;
  url: string;
}): string {
  return layout(
    `Order ${data.orderNumber} Confirmed`,
    `<h2 style="margin:0 0 16px;color:#222222;">Order Confirmed</h2>
     <p style="margin:0 0 16px;color:#747474;">Hi ${escapeHtml(data.name)},</p>
     <p style="margin:0 0 16px;color:#747474;">Thank you for your order. Your order <strong>${escapeHtml(data.orderNumber)}</strong> has been confirmed.</p>
     <p style="margin:0 0 16px;color:#747474;">Order total: <strong>Rs. ${escapeHtml(data.total)}</strong></p>
     ${cta(data.url, "View Order")}
     <p style="margin:24px 0 0;color:#747474;font-size:13px;">We appreciate your business!</p>`
  );
}

export function orderShippedEmail(data: {
  name: string;
  orderNumber: string;
  url: string;
}): string {
  return layout(
    `Order ${data.orderNumber} Shipped`,
    `<h2 style="margin:0 0 16px;color:#222222;">Your Order Has Shipped</h2>
     <p style="margin:0 0 16px;color:#747474;">Hi ${escapeHtml(data.name)},</p>
     <p style="margin:0 0 16px;color:#747474;">Good news! Your order <strong>${escapeHtml(data.orderNumber)}</strong> is on its way.</p>
     ${cta(data.url, "Track Order")}`
  );
}

export function orderDeliveredEmail(data: {
  name: string;
  orderNumber: string;
  url: string;
}): string {
  return layout(
    `Order ${data.orderNumber} Delivered`,
    `<h2 style="margin:0 0 16px;color:#222222;">Order Delivered</h2>
     <p style="margin:0 0 16px;color:#747474;">Hi ${escapeHtml(data.name)},</p>
     <p style="margin:0 0 16px;color:#747474;">Your order <strong>${escapeHtml(data.orderNumber)}</strong> has been delivered. We hope you love it!</p>
     ${cta(data.url, "Write a Review")}`
  );
}

export function resetPasswordEmail(data: {
  url: string;
}): string {
  return layout(
    "Reset Your Password",
    `<h2 style="margin:0 0 16px;color:#222222;">Reset Your Password</h2>
     <p style="margin:0 0 16px;color:#747474;">We received a request to reset your E-Mart password. Click below to continue.</p>
     ${cta(data.url, "Reset Password")}
     <p style="margin:24px 0 0;color:#747474;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`
  );
}

export function welcomeEmail(data: {
  name: string;
  url: string;
}): string {
  return layout(
    "Welcome to E-Mart",
    `<h2 style="margin:0 0 16px;color:#222222;">Welcome to E-Mart!</h2>
     <p style="margin:0 0 16px;color:#747474;">Hi ${escapeHtml(data.name)},</p>
     <p style="margin:0 0 16px;color:#747474;">Your account has been created. Start exploring our fresh, organic products today.</p>
     ${cta(data.url, "Start Shopping")}`
  );
}

export function payoutStatusEmail(data: {
  name: string;
  status: string;
  amount: number;
}): string {
  return layout(
    "Payout Update",
    `<h2 style="margin:0 0 16px;color:#222222;">Payout Update</h2>
     <p style="margin:0 0 16px;color:#747474;">Hi ${escapeHtml(data.name)},</p>
     <p style="margin:0 0 16px;color:#747474;">Your payout of <strong>Rs. ${escapeHtml(data.amount)}</strong> has been <strong>${escapeHtml(data.status)}</strong>.</p>`
  );
}
