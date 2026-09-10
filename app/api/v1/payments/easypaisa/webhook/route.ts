import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

interface EasypaisaCallbackPayload {
  orderId: string;
  transactionId: string;
  status: string;
  amount: string;
  responseCode: string;
  responseMessage: string;
  retrievalReferenceNo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = process.env.EASYPAISA_MERCHANT_ID || process.env.EASYPISA_MERCHANT_ID;
    const apiKey = process.env.EASYPAISA_API_KEY;

    if (!merchantId || !apiKey) {
      logger.warn("EasypaisaWebhook", "Payment credentials not configured. Rejecting webhook.");
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 501 }
      );
    }

    const body: EasypaisaCallbackPayload = await request.json();
    const { orderId, transactionId, status, amount, responseCode, responseMessage } = body;

    logger.info("EasypaisaWebhook", "Callback received:", {
      orderId,
      transactionId,
      status,
      responseCode,
    });

    if (!orderId || !transactionId || !status) {
      logger.warn("EasypaisaWebhook", "Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields: orderId, transactionId, status" },
        { status: 400 }
      );
    }

    // Verify the transaction with Easypaisa before trusting the callback.
    try {
      const verificationResponse = await fetch(
        "https://sandbox.paypak.io/msone/Easypaisa/api/v1/transaction/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ transactionId, orderId }),
        }
      );
      if (!verificationResponse.ok) {
        logger.error("EasypaisaWebhook", "Transaction verification request failed");
        return NextResponse.json(
          { success: false, error: "Transaction verification failed" },
          { status: 400 }
        );
      }
      const verificationResult = await verificationResponse.json();
      if (verificationResult.responseCode !== "0000") {
        logger.error("EasypaisaWebhook", "Transaction verification failed");
        return NextResponse.json(
          { success: false, error: "Transaction verification failed" },
          { status: 400 }
        );
      }
    } catch (verifyError) {
      logger.error("EasypaisaWebhook", "Verification error:", verifyError);
      return NextResponse.json(
        { success: false, error: "Transaction verification failed" },
        { status: 400 }
      );
    }

    // Webhooks run without a user session, so use the admin client to bypass RLS.
    const supabase = createAdminClient();

    const successCodes = ["0000", "00"];
    const isSuccess = successCodes.includes(responseCode) || status.toLowerCase() === "success";

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
        logger.error("EasypaisaWebhook", "Failed to update order:", error.message);
        return NextResponse.json(
          { success: false, error: "Failed to update order" },
          { status: 500 }
        );
      }

      logger.info("EasypaisaWebhook", "Order payment completed. Txn:", transactionId);
    } else {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        logger.error("EasypaisaWebhook", "Failed to mark order as failed:", error.message);
        return NextResponse.json(
          { success: false, error: "Failed to update order" },
          { status: 500 }
        );
      }

      logger.info("EasypaisaWebhook", "Order payment failed. Reason:", responseMessage);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    logger.error("EasypaisaWebhook", "Error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
