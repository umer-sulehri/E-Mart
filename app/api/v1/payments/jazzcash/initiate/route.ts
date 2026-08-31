import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface JazzCashInitiateRequest {
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

    const body: JazzCashInitiateRequest = await request.json();
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

    const jazzcashConfig = {
      merchantId: process.env.JAZZCASH_MERCHANT_ID || "mock_merchant_id",
      password: process.env.JAZZCASH_PASSWORD || "",
      returnUrls: process.env.JAZZCASH_RETURN_URLS || "",
    };

    console.log("[JazzCash Initiate] Initiating payment for order:", order.order_number, "Amount: PKR", amount);

    // Real JazzCash integration:
    // const dateNow = new Date();
    // const expiryDate = new Date(dateNow.getTime() + 24 * 60 * 60 * 1000);
    // const ppTxnDateTime = dateNow.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    // const ppExpiryDate = expiryDate.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    // const amountInPaisa = (amount * 100).toString();
    //
    // const prehashString = `${jazzcashConfig.merchantId}${ppTxnDateTime}${amountInPaisa}PKR${order.order_number}${jazzcashConfig.password}`;
    // const crypto = require("crypto");
    // const ppSecureHash = crypto.createHash("sha256").update(prehashString).digest("hex");
    //
    // const formData = new URLSearchParams({
    //   pp_MerchantID: jazzcashConfig.merchantId,
    //   pp_Password: jazzcashConfig.password,
    //   pp_TxnRefNo: order.order_number,
    //   pp_Amount: amountInPaisa,
    //   pp_TxnDateTime: ppTxnDateTime,
    //   pp_ExpiryDate: ppExpiryDate,
    //   pp_ReturnURL: jazzcashConfig.returnUrls,
    //   pp_SecureHash: ppSecureHash,
    //   pp_MobileNumber: mobileNumber,
    //   pp_Language: "EN",
    // });
    //
    // const response = await fetch("https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/Do/Transaction", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: formData.toString(),
    // });
    // const result = await response.json();
    // const redirectUrl = result.pp_RedirectURL;

    // No real JazzCash gateway is wired up. Return a clearly-labelled demo
    // response WITHOUT a fabricated external redirect URL, so the checkout falls
    // through to the app's own success flow rather than sending the user to a
    // dead third-party page.
    const mockTransactionId = `JC_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await supabase
      .from("orders")
      .update({
        payment_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.log("[JazzCash Initiate] Demo payment initiated. Transaction:", mockTransactionId);

    return NextResponse.json({
      success: true,
      mode: "demo",
      data: {
        transactionId: mockTransactionId,
        redirectUrl: "",
        amount,
        mobileNumber,
        orderNumber: order.order_number,
      },
      message: "JazzCash payment initiated (demo mode — no gateway configured)",
    });
  } catch (error) {
    console.error("[JazzCash Initiate] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
