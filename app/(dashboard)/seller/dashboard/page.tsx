'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useSellerProducts,
  useSellerEarnings,
  useDeleteSellerProduct,
  useSellerReviews,
} from '@/hooks/useSeller';
import { ProductIcon, OrderIcon, StarIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/icons';

export default function SellerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: productsData } = useSellerProducts(1, 50);
  const { data: earningsData } = useSellerEarnings();
  const { data: reviewsData } = useSellerReviews(3);
  const deleteProduct = useDeleteSellerProduct();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const sellerProducts = productsData?.products ?? [];
  const totalOrders = earningsData?.totalOrders ?? 0;
  const totalRevenue = earningsData?.totalEarnings ?? 0;
  const avgRating = sellerProducts.length > 0 ? (sellerProducts.reduce((sum, p) => sum + p.rating, 0) / sellerProducts.length) : 0;

  // Monthly earnings series from the API (falls back to flat line when empty).
  const monthlySales = earningsData?.monthly?.length
    ? earningsData.monthly.map((m) => m.amount)
    : Array.from({ length: 12 }, () => 0);
  const monthLabels = earningsData?.monthly?.length
    ? earningsData.monthly.map((m) => {
        const [y, mm] = m.month.split('-');
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(mm) - 1] + (mm === '01' ? ` '${y.slice(2)}` : '');
      })
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const maxSales = Math.max(...monthlySales, 1);

  const recentReviews = reviewsData?.reviews ?? [];

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleteError('');
    try {
      await deleteProduct.mutateAsync(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete product.');
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Seller Dashboard</h1>
            <p className="text-white/70">Welcome back, {user?.name || 'Seller'}! Here&apos;s your store overview.</p>
          </div>
          <Link href="/seller/products/new" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5" style={{ background: 'white', color: 'var(--color-primary-dark)' }}>
            <PlusIcon className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ProductIcon, label: 'Total Products', value: sellerProducts.length, color: 'var(--color-primary)' },
          { icon: OrderIcon, label: 'Total Orders', value: totalOrders, color: '#6E8B5E' },
          { icon: StarIcon, label: 'Avg Rating', value: avgRating.toFixed(1), color: '#C9902E' },
          { icon: ArrowRightIcon, label: 'Revenue', value: `Rs ${totalRevenue.toLocaleString()}`, color: '#C97B5A' },
        ].map(stat => (
          <div key={stat.label} className="rounded-[14px] p-5 transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Chart + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Monthly Sales</h3>
          <div className="flex items-end gap-1.5 h-40">
            {monthLabels.map((m, i) => (
              <div key={`${m}-${i}`} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${(monthlySales[i]/maxSales)*100}%`, background: `linear-gradient(180deg, var(--color-primary), var(--color-primary-dark))` }} />
                <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Seller Profile</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{user?.name || 'Seller'}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Phone', value: user?.phone || 'N/A' },
              { label: 'Products', value: `${sellerProducts.length} listed` },
              { label: 'Rating', value: `${avgRating} ★` },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <Link href="/seller/profile" className="block mt-4 py-2.5 rounded-xl text-sm font-semibold text-center text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>Edit Profile</Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>My Products</h3>
          <Link href="/seller/products" className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>View All →</Link>
        </div>
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
              {sellerProducts.slice(0, 5).map(product => (
                <tr key={product.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{product.category?.name}</td>
                  <td className="p-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rs {product.price.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: product.stock > 10 ? 'rgba(110,139,94,0.15)' : 'rgba(182,92,75,0.15)', color: product.stock > 10 ? '#6E8B5E' : '#B65C4B' }}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4" style={{ color: '#C9902E' }} filled />
                      <span style={{ color: 'var(--color-text-primary)' }}>{product.rating}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Link href={`/products/${product.slug}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60">
                        <EyeIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      </Link>
                      <Link href={`/seller/products/${product.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60">
                        <EditIcon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      </Link>
                      <button
                        onClick={() => setConfirmDeleteId(product.id)}
                        disabled={deleteProduct.isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60"
                        aria-label={`Delete ${product.name}`}
                      >
                        <TrashIcon className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Recent Reviews</h3>
          <Link href="/seller/reviews" className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>View All →</Link>
        </div>
        <div className="space-y-3">
          {recentReviews.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No reviews yet. Reviews on your products will appear here.</p>
          )}
          {recentReviews.map((review) => (
            <div key={review.id} className="rounded-xl p-4" style={{ background: 'var(--color-bg)', borderLeft: '4px solid var(--color-primary)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                    {review.userName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{review.userName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className="w-3.5 h-3.5" style={{ color: s < review.rating ? '#C9902E' : 'var(--color-border)' }} filled={s < review.rating} />
                  ))}
                </div>
              </div>
              {review.productName && (
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Product: <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(122,155,118,0.12)', color: 'var(--color-primary)' }}>{review.productName}</span>
                </p>
              )}
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{review.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDeleteId(null)}>
          <div className="w-full max-w-sm rounded-[16px] p-6 text-center shadow-xl" style={{ background: 'var(--color-bg)' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(182,92,75,0.12)' }}>
              <TrashIcon className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Delete product?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>This will permanently remove the product from your store.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={handleConfirmDelete} disabled={deleteProduct.isPending} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--color-error)' }}>
                {deleteProduct.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="fixed bottom-6 right-6 z-[70] rounded-xl p-4 text-sm font-medium shadow-lg flex items-center gap-2" style={{ background: 'rgba(182,92,75,0.12)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
          <CheckCircleIcon className="w-4 h-4" /> {deleteError}
        </div>
      )}
    </div>
  );
}
