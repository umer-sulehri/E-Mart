'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Filter,
  Package,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface SellerProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  status: 'active' | 'draft';
  image: string;
  category: string;
}

const mockProducts: SellerProduct[] = [
  { id: '1', name: 'Organic Basmati Rice 5kg', sku: 'RICE-001', price: 1999, stock: 150, status: 'active', image: '/images/products/rice.jpg', category: '8' },
  { id: '2', name: 'Fresh Milk 1L', sku: 'MLK-001', price: 126, salePrice: 115, stock: 200, status: 'active', image: '/images/products/milk.jpg', category: '2' },
  { id: '3', name: 'Premium Olive Oil 500ml', sku: 'OIL-001', price: 2199, stock: 80, status: 'active', image: '/images/products/olive-oil.jpg', category: '12' },
  { id: '4', name: 'Alphonso Mangoes 1kg', sku: 'MNG-001', price: 1199, salePrice: 999, stock: 45, status: 'active', image: '/images/products/mango.jpg', category: '1' },
  { id: '5', name: 'Chicken Breast Boneless 1kg', sku: 'CHK-001', price: 1399, stock: 60, status: 'active', image: '/images/products/chicken.jpg', category: '3' },
  { id: '6', name: 'Whole Wheat Bread', sku: 'BRD-001', price: 180, stock: 120, status: 'active', image: '/images/products/bread.jpg', category: '5' },
  { id: '7', name: 'Free Range Eggs (12 pack)', sku: 'EGG-001', price: 450, salePrice: 420, stock: 90, status: 'active', image: '/images/products/eggs.jpg', category: '2' },
  { id: '8', name: 'Atlantic Salmon Fillet 500g', sku: 'FISH-001', price: 2899, stock: 25, status: 'active', image: '/images/products/salmon.jpg', category: '4' },
  { id: '9', name: 'Organic Green Tea (25 bags)', sku: 'TEA-001', price: 550, stock: 0, status: 'draft', image: '/images/products/tea.jpg', category: '11' },
  { id: '10', name: 'Baby Formula Milk 400g', sku: 'BABY-001', price: 1850, stock: 35, status: 'active', image: '/images/products/formula.jpg', category: '13' },
  { id: '11', name: 'Dishwashing Liquid 1L', sku: 'HOU-001', price: 290, stock: 200, status: 'active', image: '/images/products/dishwash.jpg', category: '15' },
  { id: '12', name: 'Potato Chips (Family Pack)', sku: 'SNK-001', price: 350, salePrice: 299, stock: 180, status: 'active', image: '/images/products/chips.jpg', category: '10' },
  { id: '13', name: 'Fresh Orange Juice 1L', sku: 'JUICE-001', price: 320, stock: 0, status: 'draft', image: '/images/products/orange-juice.jpg', category: '11' },
  { id: '14', name: 'Multivitamin Supplements (30)', sku: 'HLTH-001', price: 899, stock: 50, status: 'active', image: '/images/products/vitamins.jpg', category: '14' },
  { id: '15', name: 'Cat Food Premium 2kg', sku: 'PET-001', price: 1450, stock: 40, status: 'active', image: '/images/products/cat-food.jpg', category: '17' },
];

const statusVariant: Record<string, 'success' | 'warning'> = {
  active: 'success',
  draft: 'warning',
};

const ITEMS_PER_PAGE = 8;

export default function SellerProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const filtered = mockProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    if (selected.length === paginated.length) {
      setSelected([]);
    } else {
      setSelected(paginated.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      alert(`Product ${id} deleted`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Products</h2>
          <p className="text-sm text-muted-500">Manage your product inventory</p>
        </div>
        <Link href="/seller/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-600">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary-50 p-3">
            <span className="text-sm text-primary-700">{selected.length} item(s) selected</span>
            <Button variant="danger" size="sm">Delete Selected</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Clear Selection</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.length === paginated.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 font-medium text-muted-600">Product</th>
                <th className="px-6 py-3 font-medium text-muted-600">SKU</th>
                <th className="px-6 py-3 font-medium text-muted-600">Price</th>
                <th className="px-6 py-3 font-medium text-muted-600">Stock</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                    <p className="text-sm text-muted-500">No products found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-muted-50 transition-colors hover:bg-muted-50/50"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-medium text-secondary-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-600">{product.sku}</td>
                    <td className="px-6 py-4">
                      <div>
                        {product.salePrice ? (
                          <>
                            <span className="font-semibold text-secondary-800">{formatPrice(product.salePrice)}</span>
                            <span className="ml-1.5 text-xs text-muted-400 line-through">{formatPrice(product.price)}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-secondary-800">{formatPrice(product.price)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('font-medium', product.stock === 0 ? 'text-danger' : 'text-secondary-800')}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[product.status]}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                          className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-primary-50 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-danger-50 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-muted-100 px-6 py-4">
            <p className="text-sm text-muted-500">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'text-muted-600 hover:bg-muted-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
