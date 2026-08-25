'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/seller/ProductForm';

const mockProductData = {
  name: 'Organic Basmati Rice 5kg',
  description: 'Premium quality organic basmati rice sourced directly from farms in Punjab. Aged for 2 years for extra long grains and amazing aroma.',
  category: '8',
  brand: 'Farm Fresh',
  sku: 'RICE-001',
  price: '1999',
  salePrice: '',
  stockQuantity: '150',
  weight: '5000',
  images: [],
  status: 'active' as const,
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const handleSubmit = (data: any) => {
    alert(`Product ${productId} updated successfully!`);
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
        <span className="text-secondary-800">Edit Product</span>
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
          <h2 className="text-2xl font-bold text-secondary-800">Edit Product</h2>
          <p className="text-sm text-muted-500">
            Updating: {mockProductData.name} (ID: {productId})
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm initialData={mockProductData} mode="edit" onSubmit={handleSubmit} />
    </div>
  );
}
