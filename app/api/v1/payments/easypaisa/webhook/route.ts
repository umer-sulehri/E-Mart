import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const body: EasypaisaCallbackPayload = await request.json();
    const { orderId, transactionId, status, amount, responseCode, responseMessage } = body;

    console.log("[Easypaisa Webhook] Callback received:", {
      orderId,
      transactionId,
      status,
      responseCode,
    });

    if (!orderId || !transactionId || !status) {
      console.warn("[Easypaisa Webhook] Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields: orderId, transactionId, status" },
        { status: 400 }
      );
    }

    // Verify the transaction in production:
    // const verificationPayload = {
    //   transactionId,
    //   orderId,
    // };
    // const verificationResponse = await fetch("https://sandbox.paypak.io/msone/Easypaisa/api/v1/transaction/verify", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${process.env.EASYPAISA_API_KEY}`,
    //   },
    //   body: JSON.stringify(verificationPayload),
    // });
    // const verificationResult = await verificationResponse.json();
    // if (verificationResult.responseCode !== "0000") {
    //   console.error("[Easypaisa Webhook] Transaction verification failed");
    //   return NextResponse.json({ success: false, error: "Transaction verification failed" }, { status: 400 });
    // }

    const supabase = await createClient();

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
        console.error("[Easypaisa Webhook] Failed to update order:", error.message);
        return NextResponse.json(
          { success: false, error: "Failed to update order" },
          { status: 500 }
        );
      }

      console.log("[Easypaisa Webhook] Order", orderId, "payment completed. Txn:", transactionId);
    } else {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        console.error("[Easypaisa Webhook] Failed to mark order as failed:", error.message);
      }

      console.log("[Easypaisa Webhook] Order", orderId, "payment failed. Reason:", responseMessage);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("[Easypaisa Webhook] Error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
