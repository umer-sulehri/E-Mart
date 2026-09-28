import { describe, it, expect } from "vitest";
import {
  MAX_COMPARE_ITEMS,
  MAX_SAVED_COMPARE_ITEMS,
  UNCATEGORISED_LABEL,
  canAddToCompare,
  remainingCompareSlots,
  remainingTraySlots,
  groupItemsByCategory,
  resolveActiveGroup,
  resolveGroupLabel,
  type CompareCandidate,
  type CompareGroup,
} from "../compare-rules";

function item(
  id: string,
  categoryId: string,
  category?: string
): CompareCandidate & { category?: string } {
  return category === undefined ? { id, categoryId } : { id, categoryId, category };
}

function listOf(
  count: number,
  categoryId = "cat-phones",
  prefix = "p"
): CompareCandidate[] {
  return Array.from({ length: count }, (_, i) => item(`${prefix}${i + 1}`, categoryId));
}

describe("caps", () => {
  it("compares at most 5 products side by side", () => {
    expect(MAX_COMPARE_ITEMS).toBe(5);
  });

  it("saves at most 20 products across the whole tray", () => {
    expect(MAX_SAVED_COMPARE_ITEMS).toBe(20);
  });

  it("allows the tray to hold more than one full comparison", () => {
    // If these were equal the per-category cap would be redundant, and a
    // shopper comparing two departments could never fill the second one.
    expect(MAX_SAVED_COMPARE_ITEMS).toBeGreaterThan(MAX_COMPARE_ITEMS);
  });
});

describe("canAddToCompare", () => {
  it("allows the very first product whatever its category", () => {
    expect(canAddToCompare([], item("p1", "cat-bakery"))).toEqual({
      allowed: true,
      groupLabel: UNCATEGORISED_LABEL,
      isNewGroup: true,
    });
  });

  it("allows a second product from the same category", () => {
    const decision = canAddToCompare(
      [item("p1", "cat-phones")],
      item("p2", "cat-phones")
    );
    expect(decision.allowed).toBe(true);
    if (decision.allowed) expect(decision.isNewGroup).toBe(false);
  });

  it("SAVES a product from a different category rather than refusing it", () => {
    // The whole point of the rule: a cross-category product must survive. It
    // waits in its own group instead of being compared or discarded.
    const decision = canAddToCompare(
      [item("p1", "cat-phones")],
      item("p2", "cat-bakery")
    );
    expect(decision.allowed).toBe(true);
    if (decision.allowed) expect(decision.isNewGroup).toBe(true);
  });

  it("reports the group label from the category name, not the id", () => {
    const decision = canAddToCompare(
      [item("p1", "cat-phones")],
      item("p2", "cat-bakery", "Bakery")
    );
    expect(decision.allowed && decision.groupLabel).toBe("Bakery");
  });

  it("never leaks a category uuid into the label", () => {
    const decision = canAddToCompare([], item("p1", "3f9a2c14-uuid"));
    expect(decision.allowed && decision.groupLabel).toBe(UNCATEGORISED_LABEL);
  });

  it("treats an empty category id as its own group, not as 'any'", () => {
    const decision = canAddToCompare(
      [item("p1", "cat-phones")],
      item("p2", "")
    );
    expect(decision.allowed).toBe(true);
    if (decision.allowed) expect(decision.isNewGroup).toBe(true);
  });

  it("groups by exact category, so the cap applies per category", () => {
    // Five phones fill the phone group; a sixth phone is refused...
    const five = listOf(5, "cat-phones");
    const refused = canAddToCompare(five, item("p6", "cat-phones"));
    expect(refused).toMatchObject({
      allowed: false,
      reason: "category-full",
      categoryId: "cat-phones",
      limit: MAX_COMPARE_ITEMS,
    });

    // ...while a first laptop is still accepted.
    expect(canAddToCompare(five, item("l1", "cat-laptops")).allowed).toBe(true);
  });

  it("allows the 5th product of a category and refuses the 6th", () => {
    expect(canAddToCompare(listOf(4), item("p5", "cat-phones")).allowed).toBe(true);
    expect(canAddToCompare(listOf(5), item("p6", "cat-phones")).allowed).toBe(false);
  });

  it("refuses once every category is individually full and the tray has room", () => {
    const tray = [
      ...listOf(5, "cat-phones"),
      ...listOf(5, "cat-laptops", "l"),
      ...listOf(5, "cat-bakery", "b"),
    ];
    expect(tray).toHaveLength(15);
    expect(canAddToCompare(tray, item("d1", "cat-dairy")).allowed).toBe(true);
  });

  it("refuses past the tray cap, naming the tray limit", () => {
    // Four full comparisons is exactly the tray cap: 5 x 4 = 20.
    const tray = [
      ...listOf(5, "cat-a", "a"),
      ...listOf(5, "cat-b", "b"),
      ...listOf(5, "cat-c", "c"),
      ...listOf(5, "cat-d", "d"),
    ];
    expect(tray).toHaveLength(MAX_SAVED_COMPARE_ITEMS);
    expect(canAddToCompare(tray, item("e1", "cat-e"))).toEqual({
      allowed: false,
      reason: "tray-full",
      limit: MAX_SAVED_COMPARE_ITEMS,
    });
  });

  it("still accepts a new category while every existing one is full", () => {
    // Three full comparisons leaves a slot in the tray, so a fresh category
    // must be accepted even though no existing group has room.
    const tray = [
      ...listOf(5, "cat-a", "a"),
      ...listOf(5, "cat-b", "b"),
      ...listOf(5, "cat-c", "c"),
    ];
    expect(tray).toHaveLength(15);
    expect(canAddToCompare(tray, item("d1", "cat-d")).allowed).toBe(true);
  });

  it("rejects a duplicate product", () => {
    const decision = canAddToCompare(
      [item("p1", "cat-phones")],
      item("p1", "cat-phones")
    );
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("duplicate");
      if (decision.reason === "duplicate") expect(decision.existing.id).toBe("p1");
    }
  });

  it("reports duplicate before the caps, so toggling off still works when full", () => {
    const full = [...listOf(5, "cat-phones"), ...listOf(5, "cat-laptops", "l")];
    const decision = canAddToCompare(full, full[0]);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("duplicate");
  });

  it("reports a full category before a full tray, because it names what to act on", () => {
    const full = [...listOf(5, "cat-phones"), ...listOf(5, "cat-laptops", "l")];
    const decision = canAddToCompare(full, item("p6", "cat-phones"));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("category-full");
  });

  it("rejects a duplicate even across categories when ids collide", () => {
    const decision = canAddToCompare([item("p1", "cat-phones")], item("p1", "cat-bakery"));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("duplicate");
  });
});

describe("remainingCompareSlots", () => {
  it("reports the full allowance for an untouched category", () => {
    expect(remainingCompareSlots([], "cat-phones")).toBe(5);
  });

  it("counts only the requested category", () => {
    const items = [...listOf(3, "cat-phones"), ...listOf(2, "cat-laptops", "l")];
    expect(remainingCompareSlots(items, "cat-phones")).toBe(2);
    expect(remainingCompareSlots(items, "cat-laptops")).toBe(3);
    expect(remainingCompareSlots(items, "cat-bakery")).toBe(5);
  });

  it("never goes negative when the category is already at the cap", () => {
    expect(remainingCompareSlots(listOf(5), "cat-phones")).toBe(0);
    expect(remainingCompareSlots(listOf(9), "cat-phones")).toBe(0);
  });
});

describe("remainingTraySlots", () => {
  it("reports the full allowance when empty", () => {
    expect(remainingTraySlots(0)).toBe(MAX_SAVED_COMPARE_ITEMS);
  });

  it("counts down as items are saved", () => {
    expect(remainingTraySlots(3)).toBe(17);
  });

  it("never goes negative when over the limit", () => {
    expect(remainingTraySlots(MAX_SAVED_COMPARE_ITEMS)).toBe(0);
    expect(remainingTraySlots(99)).toBe(0);
  });
});

describe("groupItemsByCategory", () => {
  it("returns nothing for an empty tray", () => {
    expect(groupItemsByCategory([])).toEqual([]);
  });

  it("puts same-category products in one group", () => {
    const groups = groupItemsByCategory(listOf(3));
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(3);
  });

  it("partitions a mixed tray, never mixing categories in a group", () => {
    const items = [
      item("a", "cat-phones", "Phones"),
      item("b", "cat-bakery", "Bakery"),
      item("c", "cat-phones", "Phones"),
    ];
    const groups = groupItemsByCategory(items);

    expect(groups.map((g) => g.categoryId)).toEqual(["cat-phones", "cat-bakery"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "c"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["b"]);
  });

  it("keeps groups in the order each category was first added", () => {
    // The group the user started with stays at the front, so switching to
    // another category and back never reorders the rail under them.
    const items = [
      item("a", "cat-phones"),
      item("b", "cat-bakery"),
      item("c", "cat-laptops"),
    ];
    expect(groupItemsByCategory(items).map((g) => g.categoryId)).toEqual([
      "cat-phones",
      "cat-bakery",
      "cat-laptops",
    ]);
  });

  it("preserves insertion order inside a group", () => {
    const groups = groupItemsByCategory([item("a", "c"), item("b", "c"), item("d", "c")]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "b", "d"]);
  });

  it("treats an unresolvable category as a single labelled group", () => {
    const groups = groupItemsByCategory([item("a", ""), item("b", "")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].categoryId).toBe("");
    expect(groups[0].label).toBe(UNCATEGORISED_LABEL);
  });

  it("labels a group from the first item that has a name", () => {
    const groups = groupItemsByCategory([item("a", "c"), item("b", "c", "Phones")]);
    expect(groups[0].label).toBe("Phones");
  });

  it("falls back to a generic label rather than exposing a uuid", () => {
    const groups = groupItemsByCategory([item("a", "3f9a2c14-uuid")]);
    expect(groups[0].label).toBe(UNCATEGORISED_LABEL);
  });

  it("carries the full item type through, not just the rule subset", () => {
    const rich = { ...item("a", "c", "Phones"), name: "Pixel", price: 100 };
    const groups = groupItemsByCategory([rich]);
    expect(groups[0].items[0].name).toBe("Pixel");
  });
});

describe("resolveActiveGroup", () => {
  const groups: CompareGroup[] = groupItemsByCategory([
    item("a", "cat-phones", "Phones"),
    item("b", "cat-bakery", "Bakery"),
  ]);

  it("returns null for an empty tray", () => {
    expect(resolveActiveGroup([], "cat-phones")).toBeNull();
  });

  it("returns the requested group", () => {
    expect(resolveActiveGroup(groups, "cat-bakery")?.categoryId).toBe("cat-bakery");
  });

  it("falls back to the first group when nothing is active", () => {
    expect(resolveActiveGroup(groups, null)?.categoryId).toBe("cat-phones");
  });

  it("falls back to the first group when the active category has no items left", () => {
    // Happens the moment the last product of the active group is removed.
    expect(resolveActiveGroup(groups, "cat-deleted")?.categoryId).toBe("cat-phones");
  });

  it("matches an uncategorised group, whose id is the empty string", () => {
    const mixed = groupItemsByCategory([item("a", "cat-phones"), item("b", "")]);
    expect(resolveActiveGroup(mixed, "")?.items[0].id).toBe("b");
  });
});

describe("resolveGroupLabel", () => {
  it("prefers the category name", () => {
    expect(resolveGroupLabel({ category: "Phones", categoryId: "uuid" })).toBe("Phones");
  });

  it("trims a padded name", () => {
    expect(resolveGroupLabel({ category: "  Phones  ", categoryId: "uuid" })).toBe("Phones");
  });

  it("falls back for a blank name", () => {
    expect(resolveGroupLabel({ category: "   ", categoryId: "uuid" })).toBe(UNCATEGORISED_LABEL);
  });

  it("falls back when there is no name at all", () => {
    expect(resolveGroupLabel({ categoryId: "uuid" })).toBe(UNCATEGORISED_LABEL);
  });
});
