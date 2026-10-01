import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

const QuantitySelector = React.forwardRef<HTMLDivElement, QuantitySelectorProps>(
  (
    {
      value,
      onChange,
      min = 1,
      max = 99,
      disabled = false,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const canDecrement = value > min && !disabled && !isLoading;
    const canIncrement = value < max && !disabled && !isLoading;

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center overflow-hidden rounded-lg border border-muted-200 bg-white",
          disabled && "opacity-50",
          className
        )}
      >
        <button
          type="button"
          onClick={() => canDecrement && onChange(value - 1)}
          disabled={!canDecrement}
          className={cn(
            "flex h-11 w-11 items-center justify-center text-lg font-medium transition-colors md:h-9 md:w-9",
            "hover:bg-muted-50 active:bg-muted-100",
            "disabled:pointer-events-none disabled:text-muted-300"
          )}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          readOnly
          aria-label={isLoading ? "Updating quantity" : "Quantity"}
          className={cn(
            "h-11 w-14 border-x border-muted-200 bg-white text-center text-base sm:text-sm font-medium md:h-9 md:w-12",
            "text-secondary-800 outline-none",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
        />
        <button
          type="button"
          onClick={() => canIncrement && onChange(value + 1)}
          disabled={!canIncrement}
          className={cn(
            "flex h-11 w-11 items-center justify-center text-lg font-medium transition-colors md:h-9 md:w-9",
            "hover:bg-muted-50 active:bg-muted-100",
            "disabled:pointer-events-none disabled:text-muted-300"
          )}
          aria-label="Increase quantity"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "+"
          )}
        </button>
      </div>
    );
  }
);

QuantitySelector.displayName = "QuantitySelector";

export default QuantitySelector;
