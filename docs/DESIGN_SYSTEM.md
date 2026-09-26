# E-Mart Design System

The visual language is **Organic**: a grocery marketplace presented with the
palette of a produce label rather than the saturated orange-and-teal of a
discount electronics site. The source of truth is the compiled Organic theme
in `organic-1.0.0/style.css`; Tailwind in `tailwind.config.ts` reproduces it.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#6BB252` | Primary actions, links, active nav, brand |
| `secondary` | `#364127` | Dark olive: headings, footer, dark surfaces, text on light |
| `danger` | `#F95F09` | Errors, destructive actions, out-of-stock |
| `warning` | `#F5A623` | Low stock, pending states |
| `success` | `#a3be4c` | In stock, order confirmed |
| `muted` | `#747474` | Secondary text, disabled, borders |
| `dark` | `#222222` | Body text on light surfaces |
| `border` | `#F7F7F7` | Hairline dividers |

Each family carries a 50–900 ramp for tints and hover states.

### Two tokens that look like bugs and are not

Do not "correct" these. Both come from the Organic source and are deliberate.

**`primary.50` is `#FFF9EB`, a warm cream, not a pale green.** In the source this
is `--bs-primary-bg-subtle`, the background tint behind primary-coloured
elements. The rest of the ramp (`primary.100` and above) *is* green. So the 50
slot is the one step that is off-hue by design; using it as a generic "lightest
primary" will produce a cream surface that does not match its neighbours.

**`primary.hover` is `#f7a422`, amber, not a darker green.** In the source this
is `--bs-btn-hover-bg`. It is a *flat* value, not part of the numeric ramp,
which means the app has two different notions of a primary hover:

- `hover:bg-primary-hover` — amber, from the source theme
- `hover:bg-primary-500` — darker green, the conventional Tailwind approach

Prefer `primary-hover` for button hovers to stay faithful to the source, and
`primary-500` for non-button tinting. Mixing them produces two visibly
different greens-to-amber transitions on adjacent buttons.

### `DEFAULT` always equals `400`

`primary.DEFAULT`, `danger.DEFAULT`, `warning.DEFAULT` and `success.DEFAULT`
are each identical to their `400` value. This is intentional so that
`bg-primary` and `bg-primary-400` render the same colour. It means the default
sits at the middle of the ramp, not at the light end.

## Typography

- Headings: Nunito, exposed as `--font-heading` (`font-heading`)
- Body: Open Sans, exposed as `--font-body` (`font-body`)

Both load through `next/font` in `app/layout.tsx` and are available as CSS
variables, so no font file is fetched from a third party.

## Spacing and shape

Standard Tailwind spacing. Cards and panels use `rounded-xl`/`rounded-2xl`;
buttons and pills are fully rounded (`rounded-full`).

## Conventions

- Icons: Lucide, sized with `size-4`/`size-5`/`size-6` rather than
  `h-* w-*` pairs, so a single axis change cannot desynchronise the box.
- Icon-only controls must carry an `aria-label`; a `title` alone is not
  sufficient, and neither is a placeholder.
- Any control that overlays a product image must stay reachable on touch.
  Hover-reveal alone fails on phones, so pair it with `focus-within` and/or a
  visible default at small breakpoints.
- The bottom edge of the viewport is reserved: `MobileBottomNav` owns
  `bottom-0`, and any other fixed bottom bar must sit above it at
  `bottom-[calc(56px+env(safe-area-inset-bottom))]`.
- `viewportFit: 'cover'` in `app/layout.tsx` is what makes
  `env(safe-area-inset-*)` resolve to a non-zero value. Removing it silently
  disables every safe-area inset in the app.
