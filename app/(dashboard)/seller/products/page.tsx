'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSellerProducts } from '@/hooks/useSeller';
import { useCategories } from '@/hooks/useCategories';
import { Product } from '@/lib/types';
import { SearchIcon, EditIcon, TrashIcon, EyeIcon, PlusIcon, StarIcon, CheckCircleIcon } from '@/components/icons';

export default function SellerProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const perPage = 10;

  const { data: productsData } = useSellerProducts(currentPage, perPage);
  const { data: categories } = useCategories();
  const CATEGORIES = categories ?? [];
  const products = productsData?.products ?? [];

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category?.slug === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>My Products</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} products</p>
        </div>
        <Link href="/seller/products/new" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
          <PlusIcon className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
          <input type="search" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full h-[48px] pl-11 pr-4 rounded-[10px] text-base focus:outline-none focus:ring-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-sm" style={{ background: 'var(--color-primary-dark)', color: 'var(--color-primary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No products found.</td></tr>
              ) : paginated.map(product => (
                <tr key={product.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{product.category?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{product.category?.name}</td>
                  <td className="p-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rs {product.price.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: product.stock > 10 ? 'rgba(110,139,94,0.15)' : product.stock > 0 ? 'rgba(201,144,46,0.15)' : 'rgba(182,92,75,0.15)', color: product.stock > 10 ? '#6E8B5E' : product.stock > 0 ? '#C9902E' : '#B65C4B' }}>
                      {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low' : 'Out'} ({product.stock})
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-3.5 h-3.5" style={{ color: '#C9902E' }} filled />
                      <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{product.rating}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>({product.reviewCount})</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewProduct(product)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60">
                        <EyeIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
                      <Link href={`/seller/products/${product.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60">
                        <EditIcon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      </Link>
                      <button onClick={() => setDeleteConfirm(product.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60">
                        <TrashIcon className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)' }}>Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* View Product Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setViewProduct(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[16px] p-6" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Product Preview</h2>
              <button onClick={() => setViewProduct(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-error)', color: 'white' }}><CheckCircleIcon className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-4 mb-6">
              <img src={viewProduct.images[0]} alt={viewProduct.name} className="w-32 h-32 rounded-xl object-cover" />
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{viewProduct.name}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{viewProduct.category?.name}</p>
                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--color-primary)' }}>Rs {viewProduct.price.toLocaleString()}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Stock: {viewProduct.stock}</p>
                <div className="flex items-center gap-1 mt-1">
                  <StarIcon className="w-4 h-4" style={{ color: '#C9902E' }} filled />
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{viewProduct.rating} ({viewProduct.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{viewProduct.description}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-[16px] p-6 text-center" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(182,92,75,0.15)' }}>
              <TrashIcon className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Delete Product?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-error)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
