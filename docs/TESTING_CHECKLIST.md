# E-Mart Testing Checklist

Automated tests and manual QA sign-off for the platform.

## Commands

| Check | Command |
|-------|---------|
| Typecheck | `npm run typecheck` |
| Build | `npm run build` |
| Unit tests | `npm run test` (Vitest) |
| Lint | `npm run lint` |

> All checks currently **green**: typecheck ✓, production build ✓ (143 routes), 143 unit tests across 12 files ✓, ESLint 0 warnings ✓.

## Issue regression grid

| # | Issue | Verification |
|---|-------|--------------|
| 1 | Compare link in header nav | Header shows "Compare" → `/compare` ✓ |
| 2 | Product detail page UX | Sticky cart, breadcrumb, reviews anchor render ✓ |
| 3 | Apply button in filters | Removed (live-apply on filter change) ✓ |
| 4 | Admin offers page | Seller/status/type filters + bulk actions ✓ |
| 5 | Image uploader | ImageUploader uploads via `/api/v1/uploads`; preview + remove ✓ |
| 6 | Admin login-as (impersonation) | **Pending** — see `Impersonation follow-up` below |
| 7 | Seller dashboard error handling | Section retries + seller `/debug` page ✓ |
| 8 | Payout method | PayoutMethodModal + API + `seller_payout_methods` table ✓ |
| 9 | "Write a Review" opens reviews tab | Opens reviews tab ✓ |
| 10 | Reviews public page polish | Real API; error/retry + empty states; no mock fallback ✓ |
| 11 | Review submission error handling | Backend + inline errors + draft autosave ✓ |
| 12 | Remove notifications system | Routes, UI, `notification_preferences` removed ✓ |
| 13 | Role UI alias | `getRoleLabel` → Buyer/Seller/Admin ✓ |

## Manual QA — admin flows

- [ ] Sign in as admin → `/admin` dashboard loads without errors.
- [ ] `/admin/users` — filter by role, block/unblock, change role.
- [ ] `/admin/offers` — filter by seller + status; toggle active/featured.
- [ ] `/admin/account` — update email/password/name; role badge reads correctly.
- [ ] Product form — upload image via ImageUploader; preview + remove work.

## Manual QA — seller flows

- [ ] `/seller` — each section shows retry on a forced API failure.
- [ ] `/seller/products` — create/edit with images; validation messages show.
- [ ] `/seller/earnings` — payout method set/update via modal.
- [ ] `/seller/payouts` — request prefill uses saved payout method.

## Manual QA — public/review flows

- [ ] Product "Write a Review" opens the reviews tab.
- [ ] Submit a review: bad rating/title/comment shows inline error; duplicate blocked.
- [ ] Draft autosave: typed draft persists on refresh, clears after success.
- [ ] `/reviews` — empty state (not mock); error banner + retry on failure.

---

## Impersonation follow-up (Issue #6) — NOT DONE

**Status:** Deferred. Requires surgery on the two security-sensitive auth files
(`lib/supabase/middleware.ts` + the auth callback), which was intentionally skipped
to avoid corrupting the verified-green build during this session.

**Planned design (do in a fresh session):**
1. Add `jose` dependency (HS256 JWT signing for the impersonation cookie).
2. `POST /api/v1/admin/impersonate` — admin-only; signs a short-lived
   `_impersonate_token` cookie with `sub=userId`, `role`, `iat/exp` (15 min),
   `aud='emart-impersonation'`. Optionally require the admin email in the
   `NEXT_PUBLIC_ADMIN_EMAILS` allow-list to self-provide this cookie.
3. Revoke route + `middleware.ts` gate: read the cookie; if present and valid,
   treat the request as the target user (swap `sb-user-role`), and reject access to
   the admin area unless the cookie role allows it.
4. `components/ui/ImpersonationBanner.tsx` — always visible, "Stop impersonating"
   calls the revoke endpoint and clears the cookie.
5. Admin users page: "Log in as" action per non-admin user row.

**Verification for this follow-up only:** typecheck + build + a manual sign-in-as
happy path; then the normal green gate.
