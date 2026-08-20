'use client';

import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { useCartStore } from '@/lib/store/cartStore';
import { CartItem } from '@/components/cart/CartItem';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/Icon';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 w-full max-w-md bg-bg z-50 shadow-xl flex flex-col"
          aria-label="Shopping cart"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Dialog.Title className="text-lg font-bold text-text-primary">
              Cart ({itemCount})
            </Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close cart">
                <CloseIcon className="w-5 h-5" />
              </IconButton>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-text-secondary text-lg">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-text-primary">Total</span>
                <span className="text-xl font-bold text-primary-dark">PKR {total.toLocaleString()}</span>
              </div>
              <Link href="/checkout" onClick={() => onOpenChange(false)}>
                <Button size="lg" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
