import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import Stripe from "stripe";

interface StripeInitiateRequest {
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

function appendQuery(baseUrl: string, params: string): string {
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}${params}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body: StripeInitiateRequest = await request.json();
    const { orderId, successUrl, cancelUrl } = body;

    if (!orderId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: "orderId, successUrl, and cancelUrl are required" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images, price))")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment_status === "completed") {
      return NextResponse.json(
        { success: false, error: "Order already paid" },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      logger.info("StripeInitiate", "Stripe not configured — returning mock session for demo");

      const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      return NextResponse.json({
        success: true,
        data: {
          sessionId: mockSessionId,
          url: appendQuery(successUrl, `session_id=${mockSessionId}&order_id=${orderId}`),
          mode: "demo",
        },
        message: "Mock Stripe session created (Stripe key not configured)",
      });
    }

    if (order.payment_method === "cod") {
      return NextResponse.json(
        { success: false, error: "This order is not payable by card" },
        { status: 400 }
      );
    }

    // Only redirect back to this app: an attacker-controlled success/cancel URL
    // would otherwise turn the endpoint into an open redirect.
    const requestOrigin = request.nextUrl.origin;
    const isSameOrigin = (value: string) => {
      try {
        const url = new URL(value);
        return url.origin === requestOrigin;
      } catch {
        return false;
      }
    };

    if (!isSameOrigin(successUrl) || !isSameOrigin(cancelUrl)) {
      return NextResponse.json(
        { success: false, error: "Invalid return URL" },
        { status: 400 }
      );
    }

    // Charge exactly the server-computed total. Itemising shipping/tax/discount
    // here would let the client-visible figures drift from the order and Stripe
    // rejects negative line-item amounts for discounts.
    const amount = Math.round(Number(order.total) * 100);

    if (!Number.isFinite(amount) || amount < 50) {
      return NextResponse.json(
        { success: false, error: "Order total is not payable online" },
        { status: 400 }
      );
    }

    const currency = (process.env.STRIPE_CURRENCY || "pkr").toLowerCase();

    // Real Stripe Checkout session
    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            product_data: {
              name: `Order ${order.order_number || orderId}`,
              description: `${order.order_items?.length ?? 0} item(s) from E-Mart`,
            },
            unit_amount: amount,
          },
        },
      ],
      success_url: appendQuery(successUrl, `session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: cancelUrl,
      customer_email: user.email ?? undefined,
      metadata: {
        orderId: orderId,
      },
      payment_intent_data: {
        metadata: { orderId },
      },
      client_reference_id: orderId,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        mode: "live",
      },
    });
  } catch (error) {
    logger.error("StripeInitiate", "Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}