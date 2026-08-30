import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("orders")
      .select("*, order_items(*, products(name, images))", { count: "exact" })
      .eq("user_id", user.id);

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orders || [],
      meta: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: page * limit < (count || 0),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { shippingAddressId, paymentMethod, notes, couponCode } = body;

    if (!shippingAddressId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "shippingAddressId and paymentMethod are required" },
        { status: 400 }
      );
    }

    // Normalize the payment method from client values to the DB enum.
    const validPaymentMethods = [
      "credit_card", "debit_card", "paypal", "stripe",
      "cash_on_delivery", "bank_transfer", "cod", "easypaisa", "jazzcash", "card",
    ];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const { data: address } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", shippingAddressId)
      .eq("user_id", user.id)
      .single();

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Shipping address not found" },
        { status: 404 }
      );
    }

    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("*, products(id, name, slug, images, price, discount_price, stock_quantity, is_active, vendor_id)")
      .eq("user_id", user.id);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    for (const item of cartItems) {
      const product = item.products as unknown as { stock_quantity: number; is_active: boolean; name: string; images: string[] };
      if (!product.is_active) {
        return NextResponse.json(
          { success: false, error: `Product "${product.name}" is no longer available` },
          { status: 400 }
        );
      }
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for "${product.name}"` },
          { status: 400 }
        );
      }
    }

    const subtotal = cartItems.reduce((sum, item) => {
      const product = item.products as unknown as { discount_price: number | null; price: number };
      const price = product.discount_price || product.price;
      return sum + price * item.quantity;
    }, 0);

    const shippingCost = subtotal >= 2000 ? 0 : 150;
    const tax = Math.round(subtotal * 0.05);

    // Validate the coupon server-side. The client-supplied discountAmount is
    // never trusted — the discount is computed from the validated coupon row.
    let discount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", String(couponCode).trim())
        .eq("is_active", true)
        .single();

      if (!coupon) {
        return NextResponse.json(
          { success: false, error: "Invalid coupon code" },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      if (coupon.starts_at && now < coupon.starts_at) {
        return NextResponse.json(
          { success: false, error: "Coupon is not yet active" },
          { status: 400 }
        );
      }
      if (coupon.expires_at && now > coupon.expires_at) {
        return NextResponse.json(
          { success: false, error: "Coupon has expired" },
          { status: 400 }
        );
      }
      if (
        coupon.usage_limit != null &&
        (coupon.used_count ?? 0) >= coupon.usage_limit
      ) {
        return NextResponse.json(
          { success: false, error: "Coupon usage limit reached" },
          { status: 400 }
        );
      }
      if (
        coupon.minimum_order_amount &&
        subtotal < coupon.minimum_order_amount
      ) {
        return NextResponse.json(
          { success: false, error: `Minimum order amount of Rs. ${coupon.minimum_order_amount} required` },
          { status: 400 }
        );
      }

      const couponValue = Number(coupon.discount_value) || 0;
      if (coupon.discount_type === "percentage") {
        discount = (subtotal * couponValue) / 100;
        if (coupon.maximum_discount_amount && discount > coupon.maximum_discount_amount) {
          discount = Number(coupon.maximum_discount_amount);
        }
      } else if (coupon.discount_type === "fixed_amount") {
        discount = couponValue;
      } else {
        discount = 0; // free_shipping
      }
    }

    // Total can never drop below zero.
    let total = Math.max(0, subtotal + shippingCost + tax - Math.floor(discount));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod,
        subtotal,
        tax,
        shipping_cost: shippingCost,
        discount,
        total,
        coupon_code: couponCode ? String(couponCode).trim() : null,
        notes,
        shipping_address_id: shippingAddressId,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      );
    }

    const orderItems = cartItems.map((item) => {
      const product = item.products as unknown as { id: string; name: string; images: string[]; price: number; discount_price: number | null; vendor_id: string | null };
      const price = product.discount_price || product.price;
      return {
        order_id: order.id,
        product_id: product.id,
        vendor_id: product.vendor_id,
        product_name: product.name,
        product_image: product.images?.[0] || "",
        quantity: item.quantity,
        price,
        total: price * item.quantity,
        discount: 0,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      // Roll back the order to avoid an orphaned record.
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { success: false, error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Decrement stock; if any decrement fails, restore stock from this order
    // and remove the order so inventory stays accurate.
    let stockError = false;
    const decremented: { id: string; original: number }[] = [];
    for (const item of cartItems) {
      const product = item.products as unknown as { id: string; stock_quantity: number };
      const original = product.stock_quantity;
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: original - item.quantity })
        .eq("id", product.id);
      if (error) {
        stockError = true;
        break;
      }
      decremented.push({ id: product.id, original });
    }

    if (stockError) {
      // Restore only the products that were actually decremented, then clean up.
      for (const d of decremented) {
        await supabase
          .from("products")
          .update({ stock_quantity: d.original })
          .eq("id", d.id);
      }
      await supabase.from("orders").delete().eq("id", order.id);
      await supabase.from("order_items").delete().eq("order_id", order.id);
      return NextResponse.json(
        { success: false, error: "Failed to update stock" },
        { status: 500 }
      );
    }

    const { error: cartError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);
    if (cartError) {
      // Stock is already decremented; leaving the cart is non-fatal.
      console.error("[orders] Failed to clear cart:", cartError.message);
    }

    return NextResponse.json(
      { success: true, data: order, message: "Order created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
