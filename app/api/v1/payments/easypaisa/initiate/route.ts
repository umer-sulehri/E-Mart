import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface EasypaisaInitiateRequest {
  orderId: string;
  mobileNumber: string;
  amount: number;
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

    const body: EasypaisaInitiateRequest = await request.json();
    const { orderId, mobileNumber, amount } = body;

    if (!orderId || !mobileNumber || !amount) {
      return NextResponse.json(
        { success: false, error: "orderId, mobileNumber, and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than zero" },
        { status: 400 }
      );
    }

    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(mobileNumber.replace(/[-\s]/g, ""))) {
      return NextResponse.json(
        { success: false, error: "Invalid Pakistani mobile number format" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status")
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

    const easypaisaConfig = {
      merchantId: process.env.EASYPAISA_MERCHANT_ID || "mock_merchant_id",
      returnUrls: process.env.EASYPAISA_RETURN_URLS || "",
    };

    console.log("[Easypaisa Initiate] Initiating payment for order:", order.order_number, "Amount: PKR", amount);

    // Real Easypaisa integration:
    // const easypaisaPayload = {
    //   merchantId: easypaisaConfig.merchantId,
    //   orderRef: order.order_number,
    //   amount: amount.toFixed(2),
    //   mobileNo: mobileNumber.replace(/[-\s]/g, ""),
    //   expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    //   returnUrls: easypaisaConfig.returnUrls,
    //   returnUrlMethod: "GET",
    // };
    //
    // const response = await fetch("https://sandbox.paypak.io/msone/Easypaisa/api/v1/checkout/session", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${process.env.EASYPAISA_API_KEY}`,
    //   },
    //   body: JSON.stringify(easypaisaPayload),
    // });
    // const result = await response.json();
    // const paymentUrl = result.data?.deeplink || result.data?.redirectUrl;

    // No real Easypaisa gateway is wired up. Return a clearly-labelled demo
    // response WITHOUT a fabricated external payment URL, so the checkout falls
    // through to the app's own success flow rather than sending the user to a
    // dead third-party page.
    const mockTransactionId = `EP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await supabase
      .from("orders")
      .update({
        payment_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.log("[Easypaisa Initiate] Demo payment initiated. Transaction:", mockTransactionId);

    return NextResponse.json({
      success: true,
      mode: "demo",
      data: {
        transactionId: mockTransactionId,
        paymentUrl: "",
        amount,
        mobileNumber,
        orderNumber: order.order_number,
      },
      message: "Easypaisa payment initiated (demo mode — no gateway configured)",
    });
  } catch (error) {
    console.error("[Easypaisa Initiate] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
