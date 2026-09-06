'use client';

import { Smartphone, CreditCard, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { PaymentFormData } from '@/lib/checkout';

interface PaymentStepProps {
  data: PaymentFormData;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSelect: (method: PaymentFormData['method']) => void;
  onBack: () => void;
  onContinue: () => void;
}

const methods: {
  id: PaymentFormData['method'];
  name: string;
  icon: typeof CreditCard;
  color: string;
}[] = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    icon: Smartphone,
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: Smartphone,
    color: 'bg-red-50 text-red-600',
  },
  {
    id: 'card',
    name: 'Credit / Debit Card (Stripe)',
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: Banknote,
    color: 'bg-amber-50 text-amber-600',
  },
];

export default function PaymentStep({
  data,
  errors,
  onChange,
  onSelect,
  onBack,
  onContinue,
}: PaymentStepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-lg font-bold text-secondary-800">
        Payment Method
      </h2>

      <div className="space-y-3">
        {methods.map((m) => {
          const Icon = m.icon;
          const isSelected = data.method === m.id;
          return (
            <div key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary-50/50'
                    : 'border-muted-200 hover:border-muted-300 bg-white'
                }`}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${m.color}`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-secondary-800">
                    {m.name}
                  </span>
                </div>
                <div
                  className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
                    isSelected ? 'border-primary' : 'border-muted-300'
                  }`}
                >
                  {isSelected && (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              </button>

              {/* Easypaisa details */}
              {m.id === 'easypaisa' && isSelected && (
                <div className="mt-3 ml-14">
                  <Input
                    label="Easypaisa Account Number"
                    placeholder="0300-1234567"
                    value={data.easypaisaAccount || ''}
                    onChange={(e) => onChange('easypaisaAccount', e.target.value)}
                    icon={<Smartphone size={16} />}
                  />
                </div>
              )}

              {/* JazzCash details */}
              {m.id === 'jazzcash' && isSelected && (
                <div className="mt-3 ml-14">
                  <Input
                    label="JazzCash Mobile Number"
                    placeholder="0300-1234567"
                    value={data.jazzcashMobile || ''}
                    onChange={(e) => onChange('jazzcashMobile', e.target.value)}
                    icon={<Smartphone size={16} />}
                  />
                </div>
              )}

              {/* Card details */}
              {m.id === 'card' && isSelected && (
                <div className="mt-3 ml-14 space-y-4">
                  <Input
                    label="Card Number"
                    placeholder="4242 4242 4242 4242"
                    value={data.cardNumber || ''}
                    onChange={(e) => onChange('cardNumber', e.target.value)}
                    icon={<CreditCard size={16} />}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Expiry"
                      placeholder="MM/YY"
                      value={data.cardExpiry || ''}
                      onChange={(e) => onChange('cardExpiry', e.target.value)}
                    />
                    <Input
                      label="CVC"
                      placeholder="123"
                      value={data.cardCvc || ''}
                      onChange={(e) => onChange('cardCvc', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* COD info */}
              {m.id === 'cod' && isSelected && (
                <div className="mt-3 ml-14 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  Pay with cash upon delivery. Available for orders within Pakistan.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errors.method && (
        <p className="text-xs text-danger">{errors.method}</p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ChevronLeft size={16} />
          Back to Shipping
        </Button>
        <Button variant="primary" size="lg" onClick={onContinue}>
          Review Order
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}