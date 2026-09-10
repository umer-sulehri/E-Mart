import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
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
      logger.warn("JazzCashWebhook", "Payment credentials not configured. Rejecting webhook.");
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 501 }
      );
    }

    const body: JazzCashCallbackPayload = await request.json();
    const { orderId, transactionId, responseCode, responseMessage, pp_SecureHash } = body;

    logger.info("JazzCashWebhook", "Callback received:", {
      orderId,
      transactionId,
      responseCode,
    });

    if (!orderId || !transactionId || !responseCode) {
      logger.warn("JazzCashWebhook", "Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields: orderId, transactionId, responseCode" },
        { status: 400 }
      );
    }

    if (!pp_SecureHash) {
      logger.error("JazzCashWebhook", "Missing pp_SecureHash");
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
      logger.error("JazzCashWebhook", "Signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Webhooks run without a user session, so use the admin client to bypass RLS.
    const supabase = createAdminClient();

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
        logger.error("JazzCashWebhook", "Failed to update order:", error.message);
        return NextResponse.json(
          { success: false, error: "Failed to update order" },
          { status: 500 }
        );
      }

      logger.info("JazzCashWebhook", "Order payment completed. Txn:", transactionId);
    } else {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        logger.error("JazzCashWebhook", "Failed to mark order as failed:", error.message);
        return NextResponse.json(
          { success: false, error: "Failed to update order" },
          { status: 500 }
        );
      }

      logger.info("JazzCashWebhook", "Order payment failed. Reason:", responseMessage);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    logger.error("JazzCashWebhook", "Error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}