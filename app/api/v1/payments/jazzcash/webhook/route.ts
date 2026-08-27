import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

interface JazzCashCallbackPayload {
  orderId: string;
  transactionId: string;
  responseCode: string;
  responseMessage: string;
  amount: string;
  retrievalReferenceNo?: string;
  pp_SecureHash?: string;
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = process.env.JAZZCASH_MERCHANT_ID;
    const password = process.env.JAZZCASH_PASSWORD;

    if (!merchantId || !password) {
      console.warn("[JazzCash Webhook] JAZZCASH_MERCHANT_ID/PASSWORD not configured. Rejecting webhook.");
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 501 }
      );
    }

    const body: JazzCashCallbackPayload = await request.json();
    const { orderId, transactionId, responseCode, responseMessage, pp_SecureHash } = body;

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

    if (!pp_SecureHash) {
      console.error("[JazzCash Webhook] Missing pp_SecureHash");
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    const prehashString = `${orderId}${transactionId}${responseCode}`;
    const expectedHash = crypto
      .createHmac("sha256", password)
      .update(prehashString)
      .digest("hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");
    const receivedBuffer = Buffer.from(pp_SecureHash, "hex");
    const signatureValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureValid) {
      console.error("[JazzCash Webhook] Signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

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
