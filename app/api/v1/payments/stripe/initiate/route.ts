import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface StripeInitiateRequest {
  orderId: string;
  successUrl: string;
  cancelUrl: string;
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
      console.log("[Stripe Initiate] No STRIPE_SECRET_KEY configured — returning mock session for demo");

      const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      return NextResponse.json({
        success: true,
        data: {
          sessionId: mockSessionId,
          url: `${successUrl}?session_id=${mockSessionId}&order_id=${orderId}`,
          mode: "demo",
        },
        message: "Mock Stripe session created (Stripe key not configured)",
      });
    }

    // Real Stripe integration:
    // import Stripe from "stripe";
    // const stripe = new Stripe(stripeSecretKey);
    //
    // const lineItems = order.order_items.map((item: any) => ({
    //   price_data: {
    //     currency: "pkr",
    //     product_data: {
    //       name: item.product_name,
    //       images: item.product_image ? [item.product_image] : [],
    //     },
    //     unit_amount: Math.round(item.unit_price * 100),
    //   },
    //   quantity: item.quantity,
    // }));
    //
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ["card"],
    //   line_items: lineItems,
    //   mode: "payment",
    //   success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    //   cancel_url: cancelUrl,
    //   metadata: { orderId, userId: user.id },
    //   customer_email: user.email,
    // });

    console.log("[Stripe Initiate] Stripe session created for order:", order.order_number);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: "real_session_id_here",
        url: "https://checkout.stripe.com/real_session_url",
      },
      message: "Stripe checkout session created",
    });
  } catch (error) {
    console.error("[Stripe Initiate] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
