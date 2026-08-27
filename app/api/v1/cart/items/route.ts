import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select("*, products(id, name, slug, price, discount_price, images, stock_quantity, is_active)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      );
    }

    const cartItems = (items || []).map((item) => {
      const product = item.products as unknown as { discount_price: number | null; price: number };
      const unitPrice = product.discount_price || product.price;
      return {
        id: item.id,
        productId: item.product_id,
        product: item.products,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        addedAt: item.created_at,
      };
    });

    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
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
    const { productId, quantity } = body;

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "productId and valid quantity are required" },
        { status: 400 }
      );
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, price, discount_price, stock_quantity, is_active")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.is_active) {
      return NextResponse.json(
        { success: false, error: "Product is not available" },
        { status: 400 }
      );
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient stock" },
        { status: 400 }
      );
    }

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock_quantity) {
        return NextResponse.json(
          { success: false, error: "Cannot add more than available stock" },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Cart item quantity updated",
      });
    }

    const { error: insertError } = await supabase.from("cart_items").insert({
      user_id: user.id,
      product_id: productId,
      quantity,
    });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Item added to cart" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
