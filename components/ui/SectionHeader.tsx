import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  viewAllLink?: string;
  viewAllText?: string;
  className?: string;
  children?: React.ReactNode;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, viewAllLink, viewAllText = "View All", className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-6 flex items-center justify-between", className)}
      >
        <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {children}
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-sm font-medium text-primary transition-colors hover:text-primary-500"
            >
              {viewAllText}
            </Link>
          )}
        </div>
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";

export default SectionHeader;
