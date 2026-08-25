import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface JazzCashCallbackPayload {
  orderId: string;
  transactionId: string;
  responseCode: string;
  responseMessage: string;
  amount: string;
  retrievalReferenceNo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: JazzCashCallbackPayload = await request.json();
    const { orderId, transactionId, responseCode, responseMessage } = body;

    console.log("[JazzCash Webhook] Callback received:", {
      orderId,
      transactionId,
      responseCode,
    });

    if (!orderId || !transactionId || !responseCode) {
      console.warn("[JazzCash Webhook] Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields: orderId, transactionId, responseCode" },
        { status: 400 }
      );
    }

    // Verify transaction signature in production:
    // const crypto = require("crypto");
    // const prehashString = `${orderId}${transactionId}${responseCode}${process.env.JAZZCASH_PASSWORD}`;
    // const expectedHash = crypto.createHash("sha256").update(prehashString).digest("hex");
    // if (body.pp_SecureHash !== expectedHash) {
    //   console.error("[JazzCash Webhook] Signature verification failed");
    //   return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    // }

    const supabase = await createClient();

    const successCodes = ["000"];
    const isSuccess = successCodes.includes(responseCode);

    if (isSuccess) {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        console.error("[JazzCash Webhook] Failed to update order:", error.message);
        return NextResponse.json(
          { success: false, error: "Failed to update order" },
          { status: 500 }
        );
      }

      console.log("[JazzCash Webhook] Order", orderId, "payment completed. Txn:", transactionId);
    } else {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        console.error("[JazzCash Webhook] Failed to mark order as failed:", error.message);
      }

      console.log("[JazzCash Webhook] Order", orderId, "payment failed. Reason:", responseMessage);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("[JazzCash Webhook] Error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
