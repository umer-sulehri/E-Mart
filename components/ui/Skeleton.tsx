import * as React from "react";
import { cn } from "@/lib/utils";

type SkeletonVariant = "text" | "circle" | "rectangle";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: "h-4 rounded-md",
  circle: "rounded-full",
  rectangle: "rounded-lg",
};

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = "text", width, height, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-muted-200",
          variantStyles[variant],
          className
        )}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export default Skeleton;
