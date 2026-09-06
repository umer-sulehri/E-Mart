'use client';

import { Truck, CreditCard, Shield, Check } from 'lucide-react';

const steps = [
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Review', icon: Shield },
];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const Icon = step.icon;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'border-primary bg-primary text-white'
                    : isActive
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-muted-200 bg-white text-muted-400'
                }`}
              >
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  isActive
                    ? 'text-primary'
                    : isCompleted
                      ? 'text-primary'
                      : 'text-muted-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 w-12 sm:w-20 ${
                  idx < currentStep ? 'bg-primary' : 'bg-muted-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}