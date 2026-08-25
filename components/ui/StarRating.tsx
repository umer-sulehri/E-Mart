import * as React from "react";
import { cn } from "@/lib/utils";

type StarSize = "sm" | "md" | "lg";

const sizeMap: Record<StarSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

const StarSvg = ({
  size,
  fill,
  halfId,
}: {
  size: number;
  fill: "full" | "half" | "empty";
  halfId?: string;
}) => {
  if (fill === "empty") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted-300"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    );
  }

  if (fill === "half" && halfId) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.5">
        <defs>
          <linearGradient id={halfId}>
            <stop offset="50%" stopColor="currentColor" className="text-warning" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
          fill={`url(#${halfId})`}
          stroke="currentColor"
          className="text-warning"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-warning"
      strokeWidth="1.5"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
};

export interface StarRatingProps {
  rating: number;
  size?: StarSize;
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ rating, size = "md", showValue = false, reviewCount, className }, ref) => {
    const clampedRating = Math.max(0, Math.min(5, rating));
    const px = sizeMap[size];

    const stars = Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      if (clampedRating >= starNumber) return "full";
      if (clampedRating >= starNumber - 0.5) return "half";
      return "empty";
    });

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-0.5", className)}
      >
        {stars.map((fill, i) => (
          <StarSvg
            key={i}
            size={px}
            fill={fill}
            halfId={fill === "half" ? `half-star-${i}-${px}` : undefined}
          />
        ))}
        {showValue && (
          <span
            className={cn(
              "ml-1 font-semibold text-secondary-800",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base"
            )}
          >
            {clampedRating.toFixed(1)}
          </span>
        )}
        {reviewCount !== undefined && (
          <span
            className={cn(
              "text-muted-500",
              size === "sm" && "text-[10px] ml-0.5",
              size === "md" && "text-xs ml-1",
              size === "lg" && "text-sm ml-1"
            )}
          >
            ({reviewCount.toLocaleString()})
          </span>
        )}
      </div>
    );
  }
);

StarRating.displayName = "StarRating";

export default StarRating;
