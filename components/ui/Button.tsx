import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "warning" | "success";
type ButtonSize = "sm" | "md" | "lg";
type ButtonRounded = "rounded" | "pill";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-500 active:bg-primary-600 focus-visible:ring-primary/40",
  secondary:
    "bg-secondary text-white hover:bg-secondary-600 active:bg-secondary-700 focus-visible:ring-secondary/40",
  outline:
    "border border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-500 focus-visible:ring-primary/40",
  ghost:
    "text-secondary hover:bg-muted-100 active:bg-muted-200 focus-visible:ring-muted/30",
  danger:
    "bg-danger text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:ring-danger/40",
  warning:
    "bg-warning text-white hover:bg-warning-600 active:bg-warning-700 focus-visible:ring-warning/40",
  success:
    "bg-success text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success/40",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-6 py-3 gap-2.5",
};

const roundedStyles: Record<ButtonRounded, string> = {
  rounded: "rounded-lg",
  pill: "rounded-full",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  loading?: boolean;
  asChild?: boolean;
}

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      rounded = "rounded",
      className,
      disabled,
      loading,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          roundedStyles[rounded],
          className
        )}
        {...props}
      >
        {loading && <Spinner className="shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
