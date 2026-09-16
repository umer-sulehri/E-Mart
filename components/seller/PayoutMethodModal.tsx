'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, CreditCard, Smartphone, Building2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface PayoutMethod {
  seller_id?: string;
  preferred_method: 'bank' | 'easypaisa' | 'jazzcash';
  bank_name?: string;
  account_title?: string;
  account_number?: string;
  iban?: string;
  easypaisa_phone?: string;
  jazzcash_phone?: string;
  updated_at?: string;
}

interface ModalProps {
  open: boolean;
  current?: PayoutMethod | null;
  loading?: boolean;
  onClose: () => void;
  onSaved: (method: PayoutMethod) => void;
}

const METHODS = [
  { value: 'bank', label: 'Bank Transfer', icon: Building2 },
  { value: 'easypaisa', label: 'Easypaisa', icon: Smartphone },
  { value: 'jazzcash', label: 'JazzCash', icon: CreditCard },
] as const;

export default function PayoutMethodModal({
  open,
  current,
  loading,
  onClose,
  onSaved,
}: ModalProps) {
  const [method, setMethod] = useState<PayoutMethod['preferred_method']>(
    current?.preferred_method || 'bank'
  );
  const [bankName, setBankName] = useState(current?.bank_name || '');
  const [accountTitle, setAccountTitle] = useState(current?.account_title || '');
  const [accountNumber, setAccountNumber] = useState(current?.account_number || '');
  const [iban, setIban] = useState(current?.iban || '');
  const [easypaisaPhone, setEasypaisaPhone] = useState(current?.easypaisa_phone || '');
  const [jazzcashPhone, setJazzcashPhone] = useState(current?.jazzcash_phone || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [methodReady, setMethodReady] = useState(false);

  useEffect(() => {
    if (open) {
      setMethod(current?.preferred_method || 'bank');
      setBankName(current?.bank_name || '');
      setAccountTitle(current?.account_title || '');
      setAccountNumber(current?.account_number || '');
      setIban(current?.iban || '');
      setEasypaisaPhone(current?.easypaisa_phone || '');
      setJazzcashPhone(current?.jazzcash_phone || '');
      setErrors({});
    }
  }, [open, current]);

  if (!open) return null;

  const handleMethodChange = (value: PayoutMethod['preferred_method']) => {
    setMethod(value);
    if (!methodReady) setMethodReady(true);
    setErrors((prev) => ({ ...prev, form: '' }));
  };

  const handleSave = async () => {
    const validation: Record<string, string> = {};
    if (method === 'bank') {
      if (!accountTitle.trim()) validation.accountTitle = 'Account title is required';
      if (!accountNumber.trim()) validation.accountNumber = 'Account number is required';
    } else if (method === 'easypaisa') {
      if (!easypaisaPhone.trim()) validation.easypaisaPhone = 'Mobile number is required';
      else if (!/^(\+92|0)3\d{9}$/.test(easypaisaPhone.trim()))
        validation.easypaisaPhone = 'Enter a valid mobile number (e.g. 0300-1234567)';
    } else if (method === 'jazzcash') {
      if (!jazzcashPhone.trim()) validation.jazzcashPhone = 'Mobile number is required';
      else if (!/^(\+92|0)3\d{9}$/.test(jazzcashPhone.trim()))
        validation.jazzcashPhone = 'Enter a valid mobile number (e.g. 0300-1234567)';
    }
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v1/seller/payout/method', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_method: method,
          bank_name: bankName,
          account_title: accountTitle,
          account_number: accountNumber,
          iban,
          easypaisa_phone: easypaisaPhone,
          jazzcash_phone: jazzcashPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payout method updated');
        onSaved(data.data);
        onClose();
      } else {
        toast.error(data.error || 'Failed to save payout method');
      }
    } catch {
      toast.error('Failed to save payout method. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const bankFields = (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Bank Name</label>
        <input
          type="text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="e.g. HBL, Meezan, UBL"
          className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Account Title</label>
        <input
          type="text"
          value={accountTitle}
          onChange={(e) => {
            setAccountTitle(e.target.value);
            setErrors((prev) => ({ ...prev, accountTitle: '' }));
          }}
          placeholder="Full name on the account"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.accountTitle
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-muted-200 focus:border-primary focus:ring-primary/20'
          }`}
        />
        {errors.accountTitle && (
          <p className="mt-1 text-xs text-danger">{errors.accountTitle}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Account Number</label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value);
            setErrors((prev) => ({ ...prev, accountNumber: '' }));
          }}
          placeholder="Enter your account number"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.accountNumber
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-muted-200 focus:border-primary focus:ring-primary/20'
          }`}
        />
        {errors.accountNumber && (
          <p className="mt-1 text-xs text-danger">{errors.accountNumber}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">
          IBAN <span className="text-xs font-normal text-muted-400">(optional)</span>
        </label>
        <input
          type="text"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          placeholder="e.g. PK36 HBLB 0011 1111 1111 1111"
          className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </>
  );

const phoneField =
    method === 'easypaisa' || method === 'jazzcash' ? (
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">
          {method === 'easypaisa' ? 'Easypaisa Mobile Number' : 'JazzCash Mobile Number'}
        </label>
        <input
          type="tel"
          value={method === 'easypaisa' ? easypaisaPhone : jazzcashPhone}
          onChange={(e) => {
            if (method === 'easypaisa') setEasypaisaPhone(e.target.value);
            else setJazzcashPhone(e.target.value);
            setErrors((prev) => ({ ...prev, [`${method}Phone`]: '' }));
          }}
          placeholder="03xx-xxxxxxx"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors[`${method}Phone`]
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-muted-200 focus:border-primary focus:ring-primary/20'
          }`}
        />
        {errors[`${method}Phone`] && (
          <p className="mt-1 text-xs text-danger">{errors[`${method}Phone`]}</p>
        )}
        <p className="mt-1 text-xs text-muted-400">
          Payouts will be sent to this number.
        </p>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-secondary-800">Payout Method</h3>
            <p className="mt-0.5 text-sm text-muted-500">
              Choose how you want to receive your earnings.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-400 transition-colors hover:bg-muted-100 hover:text-secondary-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-lg bg-muted-200" />
            <div className="h-10 rounded-lg bg-muted-200" />
            <div className="h-10 rounded-lg bg-muted-200" />
          </div>
        )}

        {!loading && (
          <>
            <label className="mb-1 block text-sm font-medium text-secondary-700">Method</label>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleMethodChange(value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                    method === value
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-muted-200 text-muted-600 hover:border-muted-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3">{method === 'bank' ? bankFields : phoneField}</div>

            {errors.form && (
              <p className="mt-2 text-xs text-danger">{errors.form}</p>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} loading={saving}>
                Save Method
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}