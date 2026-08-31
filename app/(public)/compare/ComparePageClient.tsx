'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, X, Plus, BarChart3, Trash2, Star } from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useCompareStore } from '@/store/compareStore';
import { useCartStore } from '@/store';
import type { CartItem, Product } from '@/types';
import type { Product as ProductCardType } from '@/components/product/ProductCard';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
}

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompareStore();
  const addItemToCart = useCartStore((s) => s.addItem);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/v1/products?search=${encodeURIComponent(searchQuery)}&limit=8`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          const mapped: SearchResult[] = data.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            discountPrice: p.sale_price,
            rating: p.rating || 0,
            reviewCount: p.review_count || 0,
            image: p.images?.[0] || '/images/product-thumb-1.png',
          }));
          setSearchResults(mapped.filter((m) => !items.find((i) => i.id === m.id)));
        }
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCompare = (product: SearchResult) => {
    const compareItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image: product.image,
      category: '',
      brand: '',
      inStock: true,
    };
    useCompareStore.getState().addItem(compareItem);
    setSearchResults((prev) => prev.filter((r) => r.id !== product.id));
  };

  const handleAddToCart = (item: (typeof items)[number]) => {
    const product = {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: '',
      price: item.price,
      discountPrice: item.discountPrice || undefined,
      stockQuantity: item.inStock ? 999 : 0,
      sku: '',
      category: { id: '', name: item.category || '', slug: item.category?.toLowerCase().replace(/\s+/g, '-') || '', description: '', imageUrl: '', displayOrder: 0, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      categoryId: '',
      rating: 0,
      reviewCount: 0,
      isActive: true,
      isFeatured: false,
      isNew: false,
      images: item.image ? [item.image] : [],
      tags: item.brand ? [item.brand] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as Product;
    const cartItem: CartItem = {
      id: `compare-${item.id}`,
      productId: item.id,
      product,
      unitPrice: item.discountPrice || item.price,
      quantity: 1,
      totalPrice: item.discountPrice || item.price,
      addedAt: new Date().toISOString(),
    };
    addItemToCart(cartItem);
    // Persist to the server cart when signed in; gracefully no-ops for guests.
    useCartStore.getState().addToServer(item.id, 1);
  };

  const comparisonFields = [
    { key: 'image', label: 'Image' },
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price' },
    { key: 'rating', label: 'Rating' },
    { key: 'category', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { key: 'stock', label: 'Stock Status' },
  ] as const;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 size={40} className="text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-secondary-800">
          Compare Products
        </h1>
        <p className="mt-3 text-muted-500">
          Add products to compare their features side by side.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            <Plus size={16} />
            Browse Products
          </Link>
          <p className="text-xs text-muted-400">
            You can add up to 4 products to compare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-secondary-800">
            Compare Products
          </h1>
          <p className="mt-1 text-sm text-muted-500">
            Comparing {items.length} of 4 products
          </p>
        </div>
        <div className="flex gap-3">
          {items.length < 4 && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="inline-flex items-center gap-2 rounded-xl border border-muted-200 bg-white px-4 py-2 text-sm font-semibold text-secondary-700 shadow-sm transition-colors hover:bg-muted-50"
            >
              <Plus size={16} />
              Add Product
            </button>
          )}
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-danger/20 bg-white px-4 py-2 text-sm font-semibold text-danger shadow-sm transition-colors hover:bg-danger/5"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-8 rounded-2xl border border-muted-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-secondary-700">
            Search Products to Compare
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by product name..."
              className="flex-1 rounded-xl border border-muted-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-muted-100 p-3 text-center"
                >
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="mx-auto h-20 w-20 object-contain"
                  />
                  <p className="mt-2 line-clamp-2 text-xs font-medium text-secondary-700">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs font-bold text-primary">
                    Rs. {(product.discountPrice || product.price).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleAddToCompare(product)}
                    className="mt-2 w-full rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    + Compare
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-muted-100 bg-white shadow-sm">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-muted-100">
              <th className="w-40 p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-500">
                Feature
              </th>
              {items.map((item) => (
                <th key={item.id} className="p-4 text-center">
                  <div className="relative">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted-100 text-muted-500 transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <X size={12} />
                    </button>
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                      className="mx-auto h-24 w-24 object-contain"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonFields.map((field, index) => (
              <tr
                key={field.key}
                className={index % 2 === 0 ? 'bg-muted-50/50' : ''}
              >
                <td className="p-4 text-sm font-semibold text-secondary-700">
                  {field.label}
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">
                    {field.key === 'image' ? null : field.key === 'name' ? (
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {item.name}
                      </Link>
                    ) : field.key === 'price' ? (
                      <div>
                        {item.discountPrice ? (
                          <>
                            <span className="text-sm font-bold text-danger">
                              Rs. {item.discountPrice.toLocaleString()}
                            </span>
                            <span className="ml-2 text-xs text-muted-400 line-through">
                              Rs. {item.price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-secondary-800">
                            Rs. {item.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : field.key === 'rating' ? (
                      <div className="flex items-center justify-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-secondary-700">
                          {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
                        </span>
                        {item.reviewCount > 0 && (
                          <span className="text-xs text-muted-400">
                            ({item.reviewCount})
                          </span>
                        )}
                      </div>
                    ) : field.key === 'stock' ? (
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.inStock
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    ) : field.key === 'category' ? (
                      <span className="text-sm text-secondary-600">
                        {item.category || 'N/A'}
                      </span>
                    ) : field.key === 'brand' ? (
                      <span className="text-sm text-secondary-600">
                        {item.brand || 'N/A'}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-muted-100">
              <td className="p-4 text-sm font-semibold text-secondary-700">
                Action
              </td>
              {items.map((item) => (
                <td key={item.id} className="p-4 text-center">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.inStock}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingCart size={14} />
                    Add to Cart
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
