'use client';

import { ChevronRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { ShippingFormData } from '@/lib/checkout';

interface ShippingStepProps {
  data: ShippingFormData;
  errors: Record<string, string>;
  onChange: (field: keyof ShippingFormData, value: string | boolean) => void;
  onContinue: () => void;
}

export default function ShippingStep({
  data,
  errors,
  onChange,
  onContinue,
}: ShippingStepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-lg font-bold text-secondary-800">
        Shipping Information
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="First Name"
          placeholder="Muhammad"
          value={data.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          error={errors.firstName}
        />
        <Input
          label="Last Name"
          placeholder="Ali"
          value={data.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={errors.lastName}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          placeholder="ali@example.com"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="0300-1234567"
          value={data.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          error={errors.phone}
        />
      </div>

      <Input
        label="Address Line 1"
        placeholder="House #123, Street 4"
        value={data.addressLine1}
        onChange={(e) => onChange('addressLine1', e.target.value)}
        error={errors.addressLine1}
      />

      <Input
        label="Address Line 2 (Optional)"
        placeholder="Apartment, suite, etc."
        value={data.addressLine2 || ''}
        onChange={(e) => onChange('addressLine2', e.target.value)}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="City"
          placeholder="Lahore"
          value={data.city}
          onChange={(e) => onChange('city', e.target.value)}
          error={errors.city}
        />
        <Input
          label="State / Province"
          placeholder="Punjab"
          value={data.state}
          onChange={(e) => onChange('state', e.target.value)}
          error={errors.state}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Postal Code"
          placeholder="54000"
          value={data.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          error={errors.postalCode}
        />
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-secondary-800">
            Country
          </label>
          <select
            value={data.country}
            onChange={(e) => onChange('country', e.target.value)}
            className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="Pakistan">Pakistan</option>
            <option value="India">India</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="UAE">United Arab Emirates</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
          </select>
          {errors.country && (
            <p className="mt-1.5 text-xs text-danger">{errors.country}</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary-700">
        <input
          type="checkbox"
          checked={data.saveDefault || false}
          onChange={(e) => onChange('saveDefault', e.target.checked)}
          className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/40"
        />
        Save as default address
      </label>

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="lg" onClick={onContinue}>
          Continue to Payment
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}