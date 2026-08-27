'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/store';

interface MoveToCartProps {
  itemId: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  onMoved?: () => void;
}

export default function MoveToCart({
  itemId,
  productId,
  name,
  price,
  image,
  onMoved,
}: MoveToCartProps) {
  const { addItem } = useCartStore();
  const [moved, setMoved] = useState(false);

  function handleMove() {
    addItem({
      id: `cart-${productId}-${Date.now()}`,
      productId,
      product: {
        id: productId,
        name,
        slug: '',
        price,
        images: [image],
      } as any,
      quantity: 1,
      unitPrice: price,
      totalPrice: price,
      addedAt: new Date().toISOString(),
    });

    fetch(`/api/v1/wishlist/${itemId}`, { method: 'DELETE' }).catch(() => {});

    setMoved(true);
    toast.success('Moved to cart');
    onMoved?.();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleMove}
      disabled={moved}
      className="text-xs text-muted-500 hover:text-primary"
    >
      {moved ? <Check size={14} /> : <ShoppingCart size={14} />}
      {moved ? 'Added' : 'Move to Cart'}
    </Button>
  );
}
