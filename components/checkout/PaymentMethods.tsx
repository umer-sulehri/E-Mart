'use client';

export type PaymentProvider = 'cod' | 'stripe' | 'jazzcash' | 'easypaisa';

interface PaymentMethodOption {
  id: PaymentProvider;
  name: string;
  description: string;
  badge?: string;
}

const METHODS: PaymentMethodOption[] = [
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay in cash when your order arrives' },
  { id: 'stripe', name: 'Card Payment', description: 'Visa, Mastercard & international cards', badge: 'Secured by Stripe' },
  { id: 'jazzcash', name: 'JazzCash', description: 'Pay with your JazzCash mobile wallet' },
  { id: 'easypaisa', name: 'EasyPaisa', description: 'Pay with your EasyPaisa mobile wallet' },
];

interface PaymentMethodsProps {
  value: PaymentProvider;
  onChange: (method: PaymentProvider) => void;
}

export function PaymentMethods({ value, onChange }: PaymentMethodsProps) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="space-y-3">
      {METHODS.map((method) => {
        const selected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(method.id)}
            className={`w-full text-left rounded-[12px] p-4 border-2 transition-colors min-h-[48px] ${
              selected ? 'border-primary bg-bg' : 'border-border bg-bg hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                  selected ? 'border-4 border-primary' : 'border-border'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                  {method.name}
                  {method.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-success/15 text-success px-2 py-0.5 rounded-full">
                      {method.badge}
                    </span>
                  )}
                </p>
                <p className="text-sm text-text-secondary">{method.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
