import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.warn("[Stripe Webhook] Missing stripe-signature header");
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature in production:
    // import Stripe from "stripe";
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // let event: Stripe.Event;
    // try {
    //   event = stripe.webhooks.constructEvent(
    //     body,
    //     signature,
    //     process.env.STRIPE_WEBHOOK_SECRET!
    //   );
    // } catch (err) {
    //   console.error("[Stripe Webhook] Signature verification failed:", err);
    //   return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    // }

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
