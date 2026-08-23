import Link from 'next/link';
import { Carousel } from './Carousel';

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  withCarouselArrows?: boolean;
}

export function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = 'View All',
  withCarouselArrows = false,
}: SectionHeaderProps) {
  return (
    <div className="section-header flex flex-wrap items-center justify-between mb-5 gap-3">
      <h2 className="fm-section-title">{title}</h2>
      <div className="flex items-center gap-6">
        {viewAllHref && (
          <Link href={viewAllHref} className="fm-btn-link text-decoration-none text-sm">
            {viewAllLabel} &rarr;
          </Link>
        )}
        {withCarouselArrows && <CarouselArrowsSlot />}
      </div>
    </div>
  );
}

function CarouselArrowsSlot() {
  // Arrows are rendered by the sibling Carousel via CSS positioning;
  // this spacer keeps the header layout stable.
  return <div className="hidden md:block w-[104px]" aria-hidden />;
}

export { Carousel };
