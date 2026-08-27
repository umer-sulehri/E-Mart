import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
      console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured. Rejecting webhook.");
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 501 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.warn("[Stripe Webhook] Missing stripe-signature header");
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!verifyStripeSignature(body, signature, webhookSecret)) {
      console.error("[Stripe Webhook] Signature verification failed");
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

    console.log("[Stripe Webhook] Received event:", event.type);

    const supabase = await createClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId as string | undefined;

        if (!orderId) {
          console.warn("[Stripe Webhook] checkout.session.completed missing orderId in metadata");
          break;
        }

        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: "completed",
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) {
          console.error("[Stripe Webhook] Failed to update order:", error.message);
        } else {
          console.log("[Stripe Webhook] Order", orderId, "marked as paid");
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
              status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            console.error("[Stripe Webhook] Failed to update order on payment_intent.succeeded:", error.message);
          } else {
            console.log("[Stripe Webhook] Order", orderId, "payment confirmed via payment_intent");
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
            console.error("[Stripe Webhook] Failed to update order on payment_failure:", error.message);
          } else {
            console.log("[Stripe Webhook] Order", orderId, "payment marked as failed");
          }
        }
        break;
      }

      default:
        console.log("[Stripe Webhook] Unhandled event type:", event.type);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
