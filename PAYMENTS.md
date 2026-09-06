# PAYMENTS.md

Payment gateway integration status and setup guide.

## Status: DEMO MODE (documentation only)

All payment providers are **mock/demo implementations**. No real gateway is configured,
no credentials were obtained, and no card/wallet charges happen in production.

- Placing an order with any method **does create a real order** in the database
  (status `pending`, payment status preserved per method).
- The payment step then simulates gateway behavior: Easypaisa/JazzCash/Stripe return a
  mock session/redirect that falls straight through to `/checkout/success`.
- Form fields still collect account/card details for UX, but **nothing is sent to any
  provider**.

### Flow summary

| Method    | Initiate route                                  | Webhook route                | Env guard                        |
| --------- | ----------------------------------------------- | ---------------------------- | -------------------------------- |
| Easypaisa | `POST /api/v1/payments/easypaisa/initiate`      | `/api/v1/payments/easypaisa/webhook` | `EASYPAISA_MERCHANT_ID` / `EASYPAISA_API_KEY` |
| JazzCash  | `POST /api/v1/payments/jazzcash/initiate`       | `/api/v1/payments/jazzcash/webhook`  | `JAZZCASH_MERCHANT_ID` / `JAZZCASH_PASSWORD` |
| Stripe    | `POST /api/v1/payments/stripe/initiate`         | `/api/v1/payments/stripe/webhook`    | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` |
| COD       | `POST /api/v1/payments/cod`                     | —                                | none                             |

Every initiate/webhook logs through `lib/logger.ts` (scopes `StripeInitiate`,
`StripeWebhook`, `JazzCashInitiate`, `JazzCashWebhook`, `EasypaisaInitiate`,
`EasypaisaWebhook`, `Cod`).

## Environment variables

| Variable                     | Used by            | Purpose                                              |
| ---------------------------- | ------------------ | ---------------------------------------------------- |
| `STRIPE_SECRET_KEY`          | Stripe initiate    | Server-side Stripe API key (checkout session create) |
| `STRIPE_WEBHOOK_SECRET`      | Stripe webhook     | Verify `stripe-signature` on webhook requests        |
| `JAZZCASH_MERCHANT_ID`       | JazzCash routes    | JazzCash merchant/store ID                           |
| `JAZZCASH_PASSWORD`          | JazzCash routes    | JazzCash merchant password (signature hash)          |
| `JAZZCASH_RETURN_URLS`       | JazzCash initiate  | Post-back return URLs for the hosted checkout        |
| `EASYPAISA_MERCHANT_ID`      | Easypaisa routes   | Easypaisa merchant/store ID                          |
| `EASYPAISA_API_KEY`          | Easypaisa webhook  | Bearer token for Easypaisa validation                |
| `EASYPAISA_RETURN_URLS`      | Easypaisa initiate | Post-back return URLs for the hosted checkout        |
| `NEXT_PUBLIC_SITE_URL`       | Receipt PDF        | Absolute base URL for the payment receipt route      |
| `LOG_LEVEL`                  | Logger (all)       | `debug` \| `info` \| `warn` \| `error` (server)      |

Note: `EASYPISA_MERCHANT_ID` (typo) is accepted as a fallback by the Easypaisa webhook.

## Enabling a real provider

### Stripe
1. Set `STRIPE_SECRET_KEY`.
2. Create a Checkout Session in `app/api/v1/payments/stripe/initiate/route.ts` and return
   the `url` from provider response instead of the mock `cs_demo_*` session.
3. Register the webhook endpoint `https://<site>/api/v1/payments/stripe/webhook` in the
   Stripe dashboard with the `checkout.session.completed` event and set
   `STRIPE_WEBHOOK_SECRET`.
4. The webhook verifies the signature and marks the order `payment_status = 'completed'`
   with `status = 'processing'` (and `payment_status = 'failed'` on
   `payment_intent.payment_failed`). It does not currently alter stock quantities.

### JazzCash
1. Set `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_RETURN_URLS`.
2. In `app/api/v1/payments/jazzcash/initiate/route.ts`, replace the mock
   `paymentUrl`/`email`/`sms` block with an HMAC-signed request to the JazzCash hosted
   checkout and return its redirect URL.
3. Register the webhook endpoint and implement HMAC signature verification using
   `JAZZCASH_PASSWORD` in `app/api/v1/payments/jazzcash/webhook/route.ts`.

### Easypaisa
1. Set `EASYPAISA_MERCHANT_ID`, `EASYPAISA_API_KEY`, `EASYPAISA_RETURN_URLS`.
2. Implement the hosted checkout call with the Bearer token (`EASYPAISA_API_KEY`) in
   `app/api/v1/payments/easypaisa/initiate/route.ts` (the `Authorization` header call is
   currently commented out).
3. Register the webhook endpoint and validate the signature/API key in
   `app/api/v1/payments/easypaisa/webhook/route.ts`.

### COD
Already functional — sets the order to `status = 'processing'` with
`payment_status = 'pending'` (payment collected on delivery).

## Security notes

- All payment environment variables are **server-only** (never prefix with
  `NEXT_PUBLIC_`).
- Never log card numbers, CVCs, or full wallet numbers. The logger must not be used to
  print request bodies from payment routes.
- Do not fabricate external gateway URLs — a mock redirect that lands back on the app's
  success page is safer than sending users to a dead provider page (see comment in the
  Stripe initiate route).

## Demo-mode behavior to keep in mind

- An order paid in demo mode never actually charges funds; `payment_status` reflects the
  initiated check only (easypaisa/jazzcash/card) or `pending` for COD (with
  `status = 'processing'`).
- The Stripe webhook rejects requests with `501` until `STRIPE_WEBHOOK_SECRET` is set and
  the dashboard endpoint is registered; with the secret set it verifies every signature
  using `crypto.timingSafeEqual`.