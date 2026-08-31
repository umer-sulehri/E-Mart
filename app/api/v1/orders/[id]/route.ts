import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("orders")
      .select("*, order_items(*, products(id, name, slug, images)), shipping_address:addresses!shipping_address_id(*)")
      .eq("id", id);

    if (profile?.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const shippingAddress = order.shipping_address
      ? {
          id: order.shipping_address.id,
          firstName: order.shipping_address.first_name,
          lastName: order.shipping_address.last_name,
          email: order.shipping_address.email,
          phone: order.shipping_address.phone,
          addressLine1: order.shipping_address.address_line1,
          addressLine2: order.shipping_address.address_line2,
          city: order.shipping_address.city,
          state: order.shipping_address.state,
          postalCode: order.shipping_address.postal_code,
          country: order.shipping_address.country,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        shippingAddress,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
