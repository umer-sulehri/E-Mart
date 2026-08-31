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

    // The real Stripe integration (stripe package + checkout session create) is
    // not wired up yet. Do NOT fabricate an external payment URL — instead return
    // a clearly-labelled demo session so the checkout falls through to the app's
    // own success flow rather than sending users to a dead gateway page.
    console.log("[Stripe Initiate] Stripe integration not configured — returning demo session");

    const mockSessionId = `cs_demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    return NextResponse.json({
      success: true,
      data: {
        sessionId: mockSessionId,
        url: `${successUrl}?session_id=${mockSessionId}&order_id=${orderId}`,
        mode: "demo",
      },
      message: "Stripe checkout is running in demo mode (no gateway configured)",
    });
  } catch (error) {
    console.error("[Stripe Initiate] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
