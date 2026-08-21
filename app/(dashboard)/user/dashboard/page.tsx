'use client';

import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import { useUserReviews } from '@/hooks/useReviews';
import { useAuthStore } from '@/lib/store/authStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderIcon, HeartIcon, PackageIcon, ShoppingCartIcon, StarIcon } from '@/components/icons';
import { useCategories } from '@/hooks/useCategories';

export default function UserDashboardPage() {
  const authUser = useAuthStore((s) => s.user);
  const { data: ordersData } = useOrders(1, 5);
  const { data: categories } = useCategories();
  const { data: userReviews } = useUserReviews();
  const wishlistCount = useWishlistStore(s => s.items.length);

  const recentOrders = ordersData?.orders ?? [];
  const totalOrders = ordersData?.total ?? 0;
  const displayName = authUser?.name || 'there';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-[16px] p-8" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {displayName}!</h1>
        <p className="text-white/70">Manage your orders, wishlist, and more from your dashboard.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: OrderIcon, label: 'Total Orders', value: totalOrders, color: 'var(--color-primary)' },
          { icon: HeartIcon, label: 'Wishlist', value: wishlistCount || 0, color: '#B65C4B' },
          { icon: StarIcon, label: 'Reviews', value: userReviews?.length ?? '—', color: '#C9902E' },
        ].map(stat => (
          <div key={stat.label} className="rounded-[14px] p-5 text-center transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <stat.icon className="w-8 h-8 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="rounded-[16px] p-6 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{displayName}</h3>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1" style={{ background: 'rgba(122,155,118,0.15)', color: 'var(--color-primary)' }}>{authUser?.role ? authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1) : 'Buyer'}</span>
          <div className="space-y-2 mt-4 text-left">
            {[
              { label: 'Email', value: authUser?.email || 'N/A' },
              { label: 'Phone', value: authUser?.phone || 'N/A' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>
          <Link href="/user/profile" className="block mt-4 py-2.5 rounded-xl text-sm font-semibold text-center text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>Edit Profile</Link>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShoppingCartIcon, label: 'Browse Products', desc: 'Find something new', href: '/products', color: 'var(--color-primary)' },
              { icon: HeartIcon, label: 'My Wishlist', desc: `${wishlistCount} saved items`, href: '/wishlist', color: '#B65C4B' },
              { icon: OrderIcon, label: 'Order History', desc: 'Track your orders', href: '/user/orders', color: '#6E8B5E' },
              { icon: StarIcon, label: 'Write Reviews', desc: 'Share your experience', href: '/reviews', color: '#C9902E' },
            ].map(action => (
              <Link key={action.label} href={action.href} className="rounded-[12px] p-4 transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <action.icon className="w-6 h-6 mb-2" style={{ color: action.color }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{action.label}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Shop by Category</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {(categories ?? []).map(cat => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className="rounded-[12px] p-3 text-center transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <span className="text-2xl block mb-1">{cat.icon}</span>
              <span className="text-[10px] font-semibold block" style={{ color: 'var(--color-text-primary)' }}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Recent Orders</h3>
          <Link href="/user/orders" className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>View All →</Link>
        </div>
        <div className="flex flex-col gap-3">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <PackageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-border)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>No orders yet.</p>
              <Link href="/products" className="inline-block mt-3 px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Start Shopping</Link>
            </div>
          ) : recentOrders.map(order => (
            <Link key={order.id} href={`/user/orders/${order.id}`} className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:translate-x-1" style={{ background: 'var(--color-bg)', borderLeft: '4px solid var(--color-primary)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>#{order.orderNumber}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · {order.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Rs {order.total.toLocaleString()}</span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
