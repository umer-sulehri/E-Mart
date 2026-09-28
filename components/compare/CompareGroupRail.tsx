'use client';

import { ArrowRight, Layers, X } from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { MAX_COMPARE_ITEMS, type CompareItem } from '@/store/compareStore';
import type { CompareGroup } from '@/lib/compare-rules';

interface CompareGroupRailProps {
  /** Every group in the tray, in the order each was first added. */
  groups: readonly CompareGroup<CompareItem>[];
  activeCategoryId: string;
  /** Total saved across all groups, for the rail's heading. */
  totalSaved: number;
  onActivate: (categoryId: string) => void;
  onRemove: (productId: string) => void;
}

/**
 * The saved-but-not-currently-compared categories.
 *
 * A cross-category product is never refused. It lands here instead, in its own
 * group, and becomes the subject of the comparison table only when the user
 * picks it. Without this the tray would either discard those products (losing
 * work) or silently mix them into the table (producing a meaningless
 * specification grid with no shared rows).
 *
 * The active group is deliberately absent from the rail: it is already
 * rendered as the table directly below, and listing it twice invites the
 * question of which copy is the real one.
 */
export default function CompareGroupRail({
  groups,
  activeCategoryId,
  totalSaved,
  onActivate,
  onRemove,
}: CompareGroupRailProps) {
  const inactive = groups.filter((group) => group.categoryId !== activeCategoryId);
  if (inactive.length === 0) return null;

  return (
    <section
      aria-labelledby="compare-rail-heading"
      className="mb-8 rounded-2xl border border-dashed border-muted-200 bg-muted-50/60 p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Layers size={16} className="shrink-0 text-muted-500" aria-hidden="true" />
        <h2
          id="compare-rail-heading"
          className="text-sm font-semibold text-secondary-700"
        >
          Saved in other categories
        </h2>
        <span className="rounded-full bg-muted-200 px-2 py-0.5 text-xs font-medium text-muted-600">
          {totalSaved} saved
        </span>
      </div>

      <p className="mb-4 text-xs text-muted-500">
        Only products from the same category can be compared side by side. Pick a
        category to swap it into the table below.
      </p>

      {/* Mobile-first: a snap-scrolling row so the rail never becomes a tall
          stack that pushes the actual comparison off screen. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {inactive.map((group) => (
          <li
            key={group.categoryId}
            className="w-[16rem] shrink-0 snap-start sm:w-auto"
          >
            <GroupCard
              group={group}
              onActivate={onActivate}
              onRemove={onRemove}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function GroupCard({
  group,
  onActivate,
  onRemove,
}: {
  group: CompareGroup<CompareItem>;
  onActivate: (categoryId: string) => void;
  onRemove: (productId: string) => void;
}) {
  const atCapacity = group.items.length >= MAX_COMPARE_ITEMS;
  const headingId = `compare-group-${group.categoryId || 'uncategorised'}`;

  return (
    <div className="flex h-full flex-col rounded-xl border border-muted-100 bg-white p-3 shadow-sm">
      <div className="mb-2">
        <h3 id={headingId} className="truncate text-sm font-semibold text-secondary-800">
          {group.label}
        </h3>
        <p className="text-xs text-muted-500">
          {group.items.length} of {MAX_COMPARE_ITEMS} products
          {atCapacity && <span className="ml-1 text-warning">· full</span>}
        </p>
      </div>

      <ul className="mb-3 flex flex-wrap gap-1.5">
        {group.items.map((item) => (
          <li key={item.id} className="relative">
            <ImageWithFallback
              src={item.image}
              alt={item.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg border border-muted-100 bg-white object-contain"
            />
            {/* Always visible, not hover-revealed: this is a touch target, and
                hover does not exist on the majority of the devices that reach
                a compare tray. */}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.name} from compare`}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-muted-200 bg-white text-muted-600 shadow-sm transition-colors hover:border-danger hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onActivate(group.categoryId)}
        aria-label={`Compare ${group.items.length} ${group.label} products`}
        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Compare these {group.items.length}
        <ArrowRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
