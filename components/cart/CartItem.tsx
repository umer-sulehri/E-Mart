'use client';

import { CartItem as CartItemType } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { PlusIcon, MinusIcon, TrashIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/Icon';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-3 bg-surface rounded-[16px] p-3 border border-border">
      <div className="relative w-20 h-20 flex-shrink-0 rounded-[12px] overflow-hidden bg-bg">
        <img
          src={item.product.images[0]}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-text-primary truncate">{item.product.name}</h4>
        <p className="text-sm font-medium text-primary-dark mt-1">
          PKR {item.product.price.toLocaleString()}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-border rounded-[10px] overflow-hidden">
            <button
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="w-[40px] h-[40px] flex items-center justify-center text-text-primary hover:bg-bg transition-colors"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <span className="w-[40px] h-[40px] flex items-center justify-center text-sm font-semibold text-text-primary border-x border-border">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              aria-label="Increase quantity"
              className="w-[40px] h-[40px] flex items-center justify-center text-text-primary hover:bg-bg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          <IconButton label={`Remove ${item.product.name}`} size="sm" onClick={() => removeItem(item.productId)}>
            <TrashIcon className="w-5 h-5 text-error" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
