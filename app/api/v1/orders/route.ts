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
    const { shippingAddressId, paymentMethod, notes, couponCode, discountAmount } = body;

    if (!shippingAddressId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "shippingAddressId and paymentMethod are required" },
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
    const discount = Number(discountAmount) || 0;
    const total = subtotal + shippingCost + tax - discount;

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
        coupon_code: couponCode || null,
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
      return NextResponse.json(
        { success: false, error: "Failed to create order items" },
        { status: 500 }
      );
    }

    for (const item of cartItems) {
      const product = item.products as unknown as { id: string; stock_quantity: number };
      await supabase
        .from("products")
        .update({ stock_quantity: product.stock_quantity - item.quantity })
        .eq("id", product.id);
    }

    await supabase.from("cart_items").delete().eq("user_id", user.id);

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
