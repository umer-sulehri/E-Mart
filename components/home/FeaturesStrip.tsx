import * as React from "react";
import { Truck, ShieldCheck, Star, Tag, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
  },
  {
    icon: ShieldCheck,
    title: "100% secure payment",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
  },
  {
    icon: Star,
    title: "Quality Guarantee",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
  },
  {
    icon: Tag,
    title: "guaranteed savings",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
  },
  {
    icon: Gift,
    title: "Daily Offers",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
  },
];

export interface FeaturesStripProps {
  className?: string;
}

const FeaturesStrip = React.forwardRef<HTMLDivElement, FeaturesStripProps>(
  ({ className }, ref) => {
    return (
      <section ref={ref} className={cn("py-5", className)}>
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="mb-3 rounded-[0.375rem] border border-[#dee2e6] bg-white p-4"
                >
                  <div className="mb-3 text-secondary-800">
                    <Icon size={32} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h5 className="font-heading text-base font-bold text-secondary-800">
                      {feature.title}
                    </h5>
                    <p className="mt-1 text-sm text-muted-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
);

FeaturesStrip.displayName = "FeaturesStrip";

export default FeaturesStrip;
