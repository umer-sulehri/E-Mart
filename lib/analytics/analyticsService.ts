import { OrderRepository, ProductRepository, UserRepository } from '@/lib/repositories/index';
import { cache } from '@/lib/cache/cacheManager';
import { Order, Product, User } from '@/lib/types';

export interface DashboardMetrics {
  revenueTotal: number;
  revenueToday: number;
  revenueThisMonth: number;
  ordersTotal: number;
  ordersToday: number;
  ordersThisMonth: number;
  customersTotal: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
  topProducts: { id: string; name: string; quantitySold: number; revenue: number }[];
  revenueSeries: { date: string; revenue: number; orders: number }[];
  lowStockProducts: { id: string; name: string; stock: number }[];
  ordersPerCustomer: number;
}

function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function buildRevenueSeries(orders: Order[], days: number): { date: string; revenue: number; orders: number }[] {
  const series: { date: string; revenue: number; orders: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key && o.status !== 'cancelled');
    series.push({
      date: key,
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders: dayOrders.length,
    });
  }
  return series;
}

export async function getDashboardMetrics(days = 30): Promise<DashboardMetrics> {
  return cache.wrap(`analytics:dashboard:${days}`, async () => {
    const [orders, productsResult, customers] = await Promise.all([
      OrderRepository.findAll(),
      ProductRepository.findAll({ status: 'all' }, 1, 1000),
      UserRepository.findAll(),
    ]);
    const products: Product[] = productsResult.products;

    const now = new Date();
    const validOrders = orders.filter((o) => o.status !== 'cancelled');

    const revenueTotal = validOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueToday = validOrders.filter((o) => isSameDay(o.createdAt, now)).reduce((s, o) => s + o.total, 0);
    const revenueThisMonth = validOrders.filter((o) => isSameMonth(o.createdAt, now)).reduce((s, o) => s + o.total, 0);

    const statusBreakdown: Record<string, number> = {};
    for (const order of orders) {
      statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1;
    }

    const productAgg = new Map<string, { name: string; quantitySold: number; revenue: number }>();
    for (const order of validOrders) {
      for (const item of order.items) {
        const entry = productAgg.get(item.productId) ?? { name: item.productName, quantitySold: 0, revenue: 0 };
        entry.quantitySold += item.quantity;
        entry.revenue += item.price * item.quantity;
        productAgg.set(item.productId, entry);
      }
    }
    const topProducts = [...productAgg.entries()]
      .map(([id, agg]) => ({ id, ...agg }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const buyers = new Set(validOrders.map((o) => o.userId).filter((id): id is string => !!id));

    return {
      revenueTotal,
      revenueToday,
      revenueThisMonth,
      ordersTotal: orders.length,
      ordersToday: orders.filter((o) => isSameDay(o.createdAt, now)).length,
      ordersThisMonth: orders.filter((o) => isSameMonth(o.createdAt, now)).length,
      customersTotal: customers.length,
      avgOrderValue: validOrders.length > 0 ? Math.round(revenueTotal / validOrders.length) : 0,
      statusBreakdown,
      topProducts,
      revenueSeries: buildRevenueSeries(validOrders, days),
      lowStockProducts: products
        .filter((p) => p.stock <= 5 && (!p.status || p.status === 'active'))
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10)
        .map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
      ordersPerCustomer: buyers.size > 0 ? Math.round((validOrders.length / buyers.size) * 100) / 100 : 0,
    };
  }, 60_000);
}

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','));
  }
  return lines.join('\n');
}

export async function buildSalesReport(from?: string, to?: string): Promise<string> {
  const orders = await OrderRepository.findAll();
  const filtered = orders.filter((o) => {
    const date = o.createdAt.slice(0, 10);
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
  return toCsv(
    ['order_number', 'status', 'total', 'payment_method', 'created_at'],
    filtered.map((o) => [o.orderNumber, o.status, o.total, o.paymentMethod, o.createdAt])
  );
}

export async function buildProductsReport(): Promise<string> {
  const { products } = await ProductRepository.findAll({ status: 'all' }, 1, 5000);
  return toCsv(
    ['name', 'price', 'stock', 'rating', 'review_count', 'status'],
    products.map((p) => [p.name, p.price, p.stock, p.rating, p.reviewCount, p.status])
  );
}

export async function buildCustomersReport(): Promise<string> {
  const customers: User[] = await UserRepository.findAll();
  return toCsv(
    ['name', 'email', 'phone', 'role', 'status', 'created_at'],
    customers.map((u) => [u.name ?? '', u.email ?? '', u.phone ?? '', u.role, u.status, u.createdAt])
  );
}
