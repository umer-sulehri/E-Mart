import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "danger" | "warning" | "outline";
type BadgeSize = "sm" | "md";
type BadgeRounded = "rounded" | "pill";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted-100 text-muted-700",
  primary: "bg-primary-100 text-primary-700",
  secondary: "bg-secondary-100 text-secondary-700",
  success: "bg-success-100 text-success-700",
  danger: "bg-danger-100 text-danger-700",
  warning: "bg-warning-100 text-warning-700",
  outline: "border border-muted-300 text-muted-700",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

const roundedStyles: Record<BadgeRounded, string> = {
  rounded: "rounded-md",
  pill: "rounded-full",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: BadgeRounded;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", rounded = "pill", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium leading-none whitespace-nowrap",
          variantStyles[variant],
          sizeStyles[size],
          roundedStyles[rounded],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
