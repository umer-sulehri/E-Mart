'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useProducts } from '@/hooks/useProducts';
import { HeartIcon, ShoppingCartIcon, TrashIcon, SearchIcon } from '@/components/icons';

export default function UserWishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const addItem = useCartStore(s => s.addItem);
  const [search, setSearch] = useState('');
  const { data: productsData } = useProducts({}, 1, 200);
  const allProducts = productsData?.products ?? [];

  const wishlistProducts = useMemo(() => items.map(item => {
    const product = allProducts.find(p => p.id === item.productId);
    return product ? { ...item, product } : null;
  }).filter(Boolean), [items, allProducts]);

  const filtered = search
    ? wishlistProducts.filter((item: any) => item.product.name.toLowerCase().includes(search.toLowerCase()))
    : wishlistProducts;

  const handleAddToCart = (product: any) => {
    addItem(product);
    removeItem(product.id);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">My Wishlist</h1>
        <p className="text-white/70">{wishlistProducts.length} saved items</p>
      </div>

      {wishlistProducts.length > 0 && (
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
          <input type="search" placeholder="Search wishlist..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-[48px] pl-11 pr-4 rounded-[10px] text-base focus:outline-none focus:ring-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[16px] p-12 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <HeartIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-border)' }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Your wishlist is empty</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Start browsing products and save your favorites!</p>
          <Link href="/products" className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item: any) => (
            <div key={item.productId} className="rounded-[14px] overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
              <div className="relative">
                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-48 object-cover" />
                <button onClick={() => removeItem(item.productId)} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(182,92,75,0.9)', color: 'white' }}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <Link href={`/products/${item.product.slug}`}>
                  <h3 className="font-semibold mb-1 hover:underline" style={{ color: 'var(--color-text-primary)' }}>{item.product.name}</h3>
                </Link>
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>{item.product.category?.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Rs {item.product.price.toLocaleString()}</span>
                  <button onClick={() => handleAddToCart(item.product)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                    <ShoppingCartIcon className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
