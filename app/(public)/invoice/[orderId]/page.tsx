import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/utils";

interface InvoicePageProps {
  params: Promise<{ orderId: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, order_items(product_name, product_image, price, quantity, total), profiles!inner(first_name, last_name, email, phone), addresses!orders_shipping_address_id_fkey(*) "
    )
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const isOwner = order.user_id === user.id;
  if (!isOwner && !isAdmin) notFound();

  const address = Array.isArray(order.addresses)
    ? order.addresses[0]
    : order.addresses;

  const customer = Array.isArray(order.profiles)
    ? order.profiles[0]
    : order.profiles;

  const print = () => window.print();

  return (
    <div className="min-h-screen bg-muted-50 py-8">
      <div className="container mx-auto max-w-[860px] px-4">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href={isAdmin ? "/admin/orders" : "/dashboard/orders"}
            className="inline-flex items-center gap-2 text-sm font-medium text-secondary-800 hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to orders
          </Link>
          <button
            onClick={print}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
          >
            <Printer size={16} />
            Print Invoice
          </button>
        </div>

        <div className="rounded-2xl border border-muted-200 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-muted-100 pb-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-secondary-800">
                E-Mart
              </h1>
              <p className="mt-1 text-sm text-muted-600">
                Fresh &amp; Organic Grocery Store
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-secondary-800">INVOICE</h2>
              <p className="mt-1 text-sm text-muted-600">
                Order {order.order_number}
              </p>
              <p className="text-sm text-muted-600">{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-500">
                Billed To
              </h3>
              <p className="text-sm font-medium text-secondary-800">
                {customer?.first_name} {customer?.last_name}
              </p>
              <p className="text-sm text-muted-600">{customer?.email}</p>
              {customer?.phone && (
                <p className="text-sm text-muted-600">{customer.phone}</p>
              )}
            </div>
            {address && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-500">
                  Shipping Address
                </h3>
                <p className="text-sm text-muted-600">
                  {address.address_line1}
                  {address.address_line2 ? `, ${address.address_line2}` : ""},
                  {address.city}, {address.state} {address.postal_code}
                </p>
                <p className="text-sm text-muted-600">{address.country}</p>
              </div>
            )}
          </div>

          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-muted-200 text-xs uppercase tracking-wide text-muted-500">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4 text-right">Price</th>
                  <th className="pb-3 pr-4 text-center">Qty</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="border-b border-muted-100"
                  >
                    <td className="py-3 pr-4 font-medium text-secondary-800">
                      {item.product_name}
                    </td>
                    <td className="py-3 pr-4 text-right text-muted-600">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3 pr-4 text-center text-muted-600">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right font-medium text-secondary-800">
                      {formatPrice(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-muted-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-600">
              <span>Shipping</span>
              <span>{formatPrice(order.shipping_cost || 0)}</span>
            </div>
            <div className="flex justify-between text-muted-600">
              <span>Tax</span>
              <span>{formatPrice(order.tax || 0)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-muted-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-muted-200 pt-2 text-base font-bold text-secondary-800">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-8 border-t border-muted-100 pt-6 text-center text-xs text-muted-500">
            <p>Thank you for shopping with E-Mart!</p>
            <p className="mt-1">
              If you have any questions about this invoice, please contact our
              support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
