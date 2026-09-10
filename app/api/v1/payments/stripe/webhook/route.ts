import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import crypto from "crypto";

function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): boolean {
  if (!sigHeader) return false;
  const parts = new Map<string, string>();
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx > -1) parts.set(part.slice(0, idx), part.slice(idx + 1));
  }
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn("StripeWebhook", "Webhook secret not configured. Rejecting webhook.");
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 501 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      logger.warn("StripeWebhook", "Missing stripe-signature header");
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!verifyStripeSignature(body, signature, webhookSecret)) {
      logger.error("StripeWebhook", "Signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    let event: { type: string; data: { object: any } };
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    logger.info("StripeWebhook", "Received event:", event.type);

    // Webhooks run without a user session, so use the admin client to bypass RLS.
    const supabase = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId as string | undefined;

        if (!orderId) {
          logger.warn("StripeWebhook", "checkout.session.completed missing orderId in metadata");
          break;
        }

        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Advance a fresh order into fulfillment, but never regress one that
        // a seller has already moved past processing (late webhook retry).
        await supabase
          .from("orders")
          .update({
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .in("status", ["pending", "confirmed", "processing"]);

        if (error) {
          logger.error("StripeWebhook", "Failed to update order:", error.message);
        } else {
          logger.info("StripeWebhook", "Order", orderId, "marked as paid");
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId as string | undefined;

        if (orderId) {
          const { error } = await supabase
            .from("orders")
            .update({
              payment_status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          // Same non-regressive advance as checkout.session.completed.
          await supabase
            .from("orders")
            .update({
              status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .in("status", ["pending", "confirmed", "processing"]);

          if (error) {
            logger.error("StripeWebhook", "Failed to update order on payment_intent.succeeded:", error.message);
          } else {
            logger.info("StripeWebhook", "Order", orderId, "payment confirmed via payment_intent");
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedIntent = event.data.object;
        const orderId = failedIntent.metadata?.orderId as string | undefined;

        if (orderId) {
          const { error } = await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            logger.error("StripeWebhook", "Failed to update order on payment_failure:", error.message);
          } else {
            logger.info("StripeWebhook", "Order", orderId, "payment marked as failed");
          }
        }
        break;
      }

      default:
        logger.info("StripeWebhook", "Unhandled event type:", event.type);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    logger.error("StripeWebhook", "Error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}