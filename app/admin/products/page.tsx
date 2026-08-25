'use client';

import { useState } from 'react';
import {
  Search,
  Eye,
  Flag,
  Trash2,
  Package,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type ProductStatus = 'active' | 'draft' | 'flagged';

interface MockProduct {
  id: string;
  name: string;
  seller: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  flagCount: number;
  image: string;
}

const productNames = [
  'Basmati Rice Premium 5kg', "Olper's Milk 1L", 'Organic Chicken Breast 1kg',
  'Fresh Tomatoes 1kg', 'Nestle Pure Water 1.5L', 'Folgers Coffee 200g',
  'Dal Masoor 1kg', 'Sugar Refined 2kg', 'Cooking Oil 3L', 'Atta Flour 10kg',
  'Organic Honey 500g', 'Greek Yogurt 500g', 'Almarai Cheese 200g', 'Lays Chips Family Pack',
  'Coca Cola 1.5L', 'Tang Orange 500g', 'Nestle Cream 200g', 'Fresh Bananas 1 dozen',
  'Potatoes 5kg', 'Onions 2kg', 'Chicken Wings 1kg', 'Mutton Mince 1kg',
  'Eggs 30 pack', 'White Bread 400g', 'Butter 200g', 'Naan 8 pack',
  'Green Tea 100 bags', 'Pepsi 1L', 'Simba Chips 70g', 'Knorr Noodles 5 pack',
];

const sellers = ['Fresh Valley Farms', 'Organic Basket', 'Karachi Meats', 'Green Grocery', 'Dairy Direct', 'Spice World', 'Bakery Hub'];
const categories = ['Fruits & Vegetables', 'Dairy & Eggs', 'Meat & Poultry', 'Beverages', 'Snacks', 'Bakery', 'Pasta & Rice', 'Spices & Seasonings'];

const mockProducts: MockProduct[] = productNames.map((name, i) => ({
  id: `prd-${String(i + 1).padStart(3, '0')}`,
  name,
  seller: sellers[i % sellers.length],
  category: categories[i % categories.length],
  price: Math.floor(Math.random() * 2000) + 50,
  stock: Math.floor(Math.random() * 500),
  status: i < 22 ? 'active' : i < 26 ? 'draft' : 'flagged',
  flagCount: i >= 26 ? Math.floor(Math.random() * 5) + 1 : 0,
  image: '',
}));

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = mockProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = mockProducts.length;
  const activeCount = mockProducts.filter((p) => p.status === 'active').length;
  const draftCount = mockProducts.filter((p) => p.status === 'draft').length;
  const flaggedCount = mockProducts.filter((p) => p.status === 'flagged').length;

  const getStatusBadge = (status: ProductStatus) => {
    const map: Record<ProductStatus, { variant: 'success' | 'default' | 'danger' }> = {
      active: { variant: 'success' },
      draft: { variant: 'default' },
      flagged: { variant: 'danger' },
    };
    return <Badge variant={map[status].variant} size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Products Management</h1>
        <p className="text-sm text-muted-500">Moderate and manage all seller products</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{total}</p>
              <p className="text-xs text-muted-500">Total Products</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{activeCount}</p>
              <p className="text-xs text-muted-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted-100 text-muted-600">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{draftCount}</p>
              <p className="text-xs text-muted-500">Draft</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{flaggedCount}</p>
              <p className="text-xs text-muted-500">Flagged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      {flaggedCount > 0 && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <div>
              <p className="font-medium text-secondary-800">{flaggedCount} products flagged for moderation</p>
              <p className="text-sm text-muted-600">Review flagged products for policy violations</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">Product</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Seller</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Category</th>
                <th className="pb-3 font-medium text-muted-500">Price</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Stock</th>
                <th className="pb-3 font-medium text-muted-500">Status</th>
                <th className="hidden pb-3 font-medium text-muted-500 xl:table-cell">Flags</th>
                <th className="pb-3 font-medium text-muted-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-muted-50/50">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted-100">
                        <Package className="h-5 w-5 text-muted-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-secondary-800">{product.name}</p>
                        <p className="truncate text-xs text-muted-500 md:hidden">{product.seller}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden py-3 text-secondary-800 md:table-cell">{product.seller}</td>
                  <td className="hidden py-3 text-muted-600 lg:table-cell">{product.category}</td>
                  <td className="py-3 font-medium text-secondary-800">₨{product.price.toLocaleString()}</td>
                  <td className="hidden py-3 lg:table-cell">
                    <span className={cn('font-medium', product.stock < 20 ? 'text-danger' : 'text-secondary-800')}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3">{getStatusBadge(product.status)}</td>
                  <td className="hidden py-3 xl:table-cell">
                    {product.flagCount > 0 ? (
                      <Badge variant="danger" size="sm">{product.flagCount}</Badge>
                    ) : (
                      <span className="text-muted-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-warning-50 hover:text-warning">
                        <Flag className="h-4 w-4" />
                      </button>
                      <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
