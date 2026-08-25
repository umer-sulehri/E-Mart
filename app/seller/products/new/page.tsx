'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Home, ArrowLeft, Store } from 'lucide-react';
import ProductForm from '@/components/seller/ProductForm';

export default function AddProductPage() {
  const router = useRouter();

  const handleSubmit = (data: any) => {
    alert('Product created successfully!');
    router.push('/seller/products');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-muted-500 transition-colors hover:text-primary"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/seller" className="text-muted-500 transition-colors hover:text-primary">
          Seller Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/seller/products" className="text-muted-500 transition-colors hover:text-primary">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-secondary-800">Add New</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Add New Product</h2>
          <p className="text-sm text-muted-500">Fill in the details to list a new product</p>
        </div>
      </div>

      {/* Form */}
      <ProductForm mode="add" onSubmit={handleSubmit} />
    </div>
  );
}
