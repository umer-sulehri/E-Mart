import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import type { CartItem, Product } from '@/types';

export interface LightProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  image?: string;
}

function buildCartItem(product: LightProduct, quantity: number): CartItem {
  const unitPrice = product.discountPrice ?? product.price;
  const fullProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: '',
    price: product.price,
    discountPrice: product.discountPrice,
    stockQuantity: 999,
    sku: '',
    category: { id: '', name: '', slug: '' },
    categoryId: '',
    rating: 0,
    reviewCount: 0,
    isActive: true,
    isFeatured: false,
    isNew: false,
    images: product.image ? [product.image] : [],
    createdAt: '',
    updatedAt: '',
  } as Product;

  return {
    id: `cart-${product.id}-${Date.now()}`,
    productId: product.id,
    product: fullProduct,
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
    addedAt: new Date().toISOString(),
  };
}

export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);
  const addToServer = useCartStore((s) => s.addToServer);

  const openCart = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-cart'));
    }
  }, []);

  const addToCart = useCallback(
    (product: LightProduct, quantity = 1) => {
      if (quantity < 1 || !product.id) return;
      const item = buildCartItem(product, quantity);
      addItem(item);
      addToServer(product.id, quantity);
      toast.success(`${product.name} added to cart!`);
    },
    [addItem, addToServer]
  );

  return { addToCart, openCart };
}
