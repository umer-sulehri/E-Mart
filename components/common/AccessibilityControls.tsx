'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useUiStore } from '@/lib/store/uiStore';
import { AccessibilityIcon } from '@/components/icons';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export function AccessibilityControls() {
  const highContrast = useUiStore((s) => s.highContrast);
  const toggleHighContrast = useUiStore((s) => s.toggleHighContrast);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Accessibility controls"
          className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-full text-text-primary hover:bg-surface-alt transition-colors"
        >
          <AccessibilityIcon className="w-6 h-6" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="min-w-[220px] bg-bg border border-border rounded-[12px] shadow-lg p-2 z-50"
        >
          <DropdownMenu.Label className="px-3 py-2 text-sm font-semibold text-text-primary">
            Accessibility
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="h-px bg-border my-1" />

          <DropdownMenu.Item
            onSelect={(e) => {
              e.preventDefault();
              toggleHighContrast();
            }}
            className="flex items-center justify-between px-3 py-3 rounded-[8px] text-sm text-text-primary cursor-pointer outline-none hover:bg-surface transition-colors min-h-[48px]"
          >
            <span>High Contrast</span>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                highContrast ? 'bg-primary' : 'bg-border'
              }`}
              aria-hidden="true"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-bg transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-border my-1" />

          <DropdownMenu.Item asChild>
            <div className="px-1 py-1">
              <LanguageSwitcher />
            </div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
