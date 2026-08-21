'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useAdminProducts, useDeleteProduct } from '@/hooks/useAdmin';
import { useCategories } from '@/hooks/useCategories';
import { PlusIcon, EyeIcon, EditIcon, TrashIcon } from '@/components/icons';
import type { Product } from '@/lib/types';

export default function ProductsManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const itemsPerPage = 10;

  const { data: adminData, isLoading } = useAdminProducts(currentPage, itemsPerPage);
  const { data: categories } = useCategories();
  const products = adminData?.products;
  const totalCount = adminData?.total;

  const deleteProduct = useDeleteProduct();

  const filteredProducts = useMemo(() => {
    let result = products || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p: any) => p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      result = result.filter((p: any) => p.category?.id === categoryFilter || p.categoryId === categoryFilter);
    }
    return result;
  }, [products, search, categoryFilter]);
  const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-error text-error' };
    if (stock <= 20) return { label: 'Low Stock', color: 'bg-warning text-warning' };
    return { label: 'In Stock', color: 'bg-success text-success' };
  };

  const handleView = (product: any) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleDelete = (product: any) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct.mutate(selectedProduct.id);
      showToast('Product deleted successfully', 'success');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await fetch(`/api/v1/admin/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedProduct),
      });
      showToast('Product updated successfully', 'success');
      setEditModalOpen(false);
      setSelectedProduct(null);
    } catch {
      showToast('Failed to update product', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Product Management
            </h1>
            <p className="mt-1 text-text-secondary">
              {totalCount ?? 0} products total
            </p>
          </div>
          <Link href="/admin/products/new">
            <Button className="flex items-center gap-2 rounded-[12px] min-h-[48px] min-w-[48px] bg-primary px-6 text-primary">
              <PlusIcon className="h-5 w-5" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-[16px] bg-surface border border-border p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                label="Search products"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[48px] rounded-[10px]"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[48px] w-full rounded-[10px] border border-border bg-surface px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {(categories ?? []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="rounded-[16px] bg-surface border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-dark text-primary">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product: Product) => {
                    const stock = product.stock ?? 0;
                    const stockStatus = getStockStatus(stock);
                    return (
                      <tr key={product.id} className="hover:bg-surface-alt transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[8px]">
                              <img
                                src={product.images?.[0] || '/placeholder.png'}
                                alt={product.name}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium text-text-primary">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          {product.category?.name || '—'}
                        </td>
                        <td className="px-6 py-4 font-medium text-text-primary">
                          ${(product.price ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${stockStatus.color}`}>
                            {stockStatus.label}
                            <span className="ml-1 text-text-secondary">({stock})</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {product.createdAt
                            ? new Date(product.createdAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleView(product)}
                              className="flex h-12 w-12 items-center justify-center rounded-[8px] text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
                              aria-label="View product"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="flex h-12 w-12 items-center justify-center rounded-[8px] text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
                              aria-label="Edit product"
                            >
                              <EditIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="flex h-12 w-12 items-center justify-center rounded-[8px] text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
                              aria-label="Delete product"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-sm text-text-secondary">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-4 text-text-primary disabled:opacity-50"
                >
                  Prev
                </Button>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-4 text-text-primary disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* View Product Modal */}
      {viewModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg rounded-[16px] bg-surface border border-border p-6">
            <h2 className="mb-4 text-xl font-bold text-text-primary">Product Details</h2>
            <div className="mb-4 overflow-hidden rounded-[10px]">
              <img
                src={selectedProduct.image || '/placeholder.png'}
                alt={selectedProduct.name}
                width={400}
                height={200}
                className="h-48 w-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-text-secondary">Name</span>
                <p className="font-medium text-text-primary">{selectedProduct.name}</p>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Category</span>
                <p className="font-medium text-text-primary">{selectedProduct.categoryName || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-text-secondary">Price</span>
                  <p className="font-medium text-text-primary">${(selectedProduct.price ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Stock</span>
                  <p className="font-medium text-text-primary">{selectedProduct.stock ?? 0}</p>
                </div>
              </div>
              {selectedProduct.description && (
                <div>
                  <span className="text-sm text-text-secondary">Description</span>
                  <p className="text-text-primary">{selectedProduct.description}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => { setViewModalOpen(false); setSelectedProduct(null); }}
                className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-6 text-text-primary"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Product Modal */}
      {editModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg rounded-[16px] bg-surface border border-border p-6">
            <h2 className="mb-4 text-xl font-bold text-text-primary">Edit Product</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-text-secondary">Product Name</label>
                <Input
                  label="Product Name"
                  value={selectedProduct.name || ''}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                  className="h-[48px] rounded-[10px]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">Price</label>
                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    value={selectedProduct.price ?? 0}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) || 0 })}
                    className="h-[48px] rounded-[10px]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">Stock</label>
                  <Input
                    label="Stock"
                    type="number"
                    value={selectedProduct.stock ?? 0}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: parseInt(e.target.value) || 0 })}
                    className="h-[48px] rounded-[10px]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-text-secondary">Description</label>
                <textarea
                  value={selectedProduct.description || ''}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                  className="w-full rounded-[10px] border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setSelectedProduct(null); }}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-6 text-text-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-primary px-6 text-primary"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-[16px] bg-surface border border-border p-6">
            <h2 className="mb-2 text-xl font-bold text-text-primary">Delete Product</h2>
            <p className="mb-6 text-text-secondary">
              Are you sure you want to delete{' '}
              <span className="font-medium text-text-primary">{selectedProduct.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => { setDeleteModalOpen(false); setSelectedProduct(null); }}
                className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-6 text-text-primary"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteProduct.isPending}
                className="rounded-[12px] min-h-[48px] min-w-[48px] bg-error px-6 text-error disabled:opacity-50"
              >
                {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
