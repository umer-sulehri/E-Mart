# E-Mart — Supabase Auth & Formspree Integration Guide

> **Single source of truth** for how authentication (email confirmation) and form
> handling work in E-Mart. Written for developers who have never used Supabase or
> Formspree. Every code path referenced here exists in this repository.

- **App:** E-Mart e-commerce platform (Next.js App Router, React 19)
- **Auth + DB:** Supabase (`@supabase/ssr`)
- **Forms:** Formspree endpoint `https://formspree.io/f/mzepqqee`
- **Production:** https://e-mart-gules.vercel.app

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Supabase Dashboard Setup](#2-supabase-dashboard-setup)
3. [Register Flow](#3-register-flow)
4. [Email Verification Flow](#4-email-verification-flow)
5. [Login Flow](#5-login-flow)
6. [Password Reset Flow](#6-password-reset-flow)
7. [Formspree Integration](#7-formspree-integration)
8. [End-to-End Workflow Diagram](#8-end-to-end-workflow-diagram)
9. [Testing & Debugging](#9-testing--debugging)
10. [Security & Best Practices](#10-security--best-practices)
11. [Design Decisions Explained](#11-design-decisions-explained)
12. [Final Verification Checklist](#12-final-verification-checklist)

---

## 1. Architecture Overview

E-Mart keeps **all Supabase calls on the server** inside Next.js API routes.
The browser only ever talks to our own `/api/v1/*` endpoints via `apiFetch()`.
There is no custom JWT system — Supabase issues and stores the session cookie.

```
Browser (React pages)          Next.js API routes              Supabase / Formspree
─────────────────────          ──────────────────              ────────────────────
app/(auth)/register  ──POST──▶ /api/v1/auth/register    ─signUp─▶ Supabase Auth
app/(auth)/login     ──POST──▶ /api/v1/auth/login       ─signIn─▶ Supabase Auth
app/(auth)/forgot-…  ──POST──▶ /api/v1/auth/forgot-password ─────▶ recovery email
app/(auth)/reset-…   ──browser─▶ supabase.auth.updateUser ───────▶ new password set
login "Resend email" ──POST──▶ /api/v1/auth/resend-verification ──▶ confirmation email
register success     ──fetch──▶ https://formspree.io/f/mzepqqee   ▶ owner notification
contact page         ──POST──▶ /api/v1/contact ─Resend/Formspree─▶ owner inbox
```

### Where everything lives

```
app/
├── (auth)/                          # auth screens (shared AuthLayout shell)
│   ├── register/page.tsx            # sign-up form → POST /auth/register
│   ├── login/page.tsx               # sign-in form + "Resend verification" button
│   ├── forgot-password/page.tsx     # request reset link
│   └── reset-password/page.tsx      # set new password from emailed link
├── (public)/contact/page.tsx        # contact form (goes through our API → Formspree)
└── api/v1/auth/
    ├── register/route.ts            # signUp + metadata + profile seeding
    ├── login/route.ts               # signInWithPassword + lockout + cookies
    ├── resend-verification/route.ts # supabase.auth.resend()
    ├── forgot-password/route.ts     # resetPasswordForEmail()
    └── logout/route.ts
lib/supabase/
├── server.ts                        # createClient()  — cookie-bound server client
├── client.ts                        # createClient()  — browser client (reset page only)
├── admin.ts                         # createAdminClient() — service-role (never exposed)
└── optional.ts                      # isSupabaseConfigured() guards
hooks/useAuth.ts                     # useLogin / useRegister / useResendVerification …
components/common/AuthLayout.tsx     # shared split-screen auth shell
docs/AUTH_FORMSPREE_GUIDE.md         # ← this file
```

---

## 2. Supabase Dashboard Setup

### 2.1 Enable email confirmation

1. Open your project at **supabase.com/dashboard**.
2. Go to **Authentication → Sign In / Providers → Email**.
3. Toggle **Confirm email** ON → Save.

With this ON, `signUp()` does **not** return a session; Supabase emails the user a
confirmation link. With it OFF, `signUp()` returns a session immediately (our
register route detects this and marks the account as instantly verified).

### 2.2 URL configuration

**Authentication → URL Configuration:**

| Setting | Value |
|---|---|
| Site URL | `https://e-mart-gules.vercel.app` |
| Redirect URLs | `https://e-mart-gules.vercel.app/**` |
| Redirect URLs | `http://localhost:3000/**` |

The app passes explicit `emailRedirectTo` targets (`/login` after signup,
`/reset-password` after a reset request). Any redirect target **must** match an
entry in this allow-list, otherwise Supabase silently falls back to Site URL.

Also set env var in Vercel (**Settings → Environment Variables**):

```
NEXT_PUBLIC_SITE_URL=https://e-mart-gules.vercel.app
```

The API routes use it first and fall back to the incoming request origin:

```ts
const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
```

### 2.3 SMTP (important!)

Supabase's **built-in email sender allows only ~2 emails/hour** on free tiers.
For anything beyond testing configure **Authentication → Emails → SMTP Settings**
(Resend, Postmark, Gmail SMTP all work). Without this, real signups will stop
receiving mails quickly.

---

## 3. Register Flow

**Route:** `POST /api/v1/auth/register` · **UI:** `app/(auth)/register/page.tsx`

### Step 1 — Client validates and submits

The page enforces name/email format, strong-password rules (8+ chars, upper,
lower, number), PK phone format, and terms acceptance before calling:

```ts
// hooks/useAuth.ts
export function useRegister() {
  return useMutation({
    mutationFn: (data: { name; email; password; userType; phone? }) =>
      apiFetch<{ verified?: boolean; verificationRequired?: boolean }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(data) },
      ),
  });
}
```

### Step 2 — Server creates the auth user

```ts
// app/api/v1/auth/register/route.ts (essentials)
const role = userType === 'seller' ? 'seller' : 'buyer';
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name, phone: phone ?? '', role },      // becomes user_metadata
    emailRedirectTo: `${origin}/login`,            // where the email link lands
  },
});

if (error?.code === 'user_already_exists') → 409 "already exists"
if (data.session) → { verified: true }        // confirm-email disabled case
else               → { verificationRequired: true }
```

Why metadata matters: the **profile row is created on first login** using this
metadata (name/phone/role), so sellers don't get mis-typed as buyers if they
log in before any other step runs.

### Step 3 — Owner notification (Formspree)

On success the register page fires a non-blocking notification so the site
owner learns about every new signup even without DB access:

```ts
// app/(auth)/register/page.tsx
fetch(FORMSPREE_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ _subject: `New E-Mart registration: ${name}`, name, email, phone, role }),
}).catch(() => undefined); // a Formspree outage must never block registration
```

### Step 4 — What the user sees

| Case | Screen |
|---|---|
| Confirmation required | ✉️ *"We've sent a verification link to you@example.com"* + Go to Login |
| Confirm-email disabled | ✅ *"Your account is ready. You can log in right away."* |
| Email already registered | Inline error suggesting login instead |

---

## 4. Email Verification Flow

1. User clicks the link in Supabase's email.
2. Link opens `<SiteURL>/login?...` with one-time tokens in the fragment.
3. Supabase exchanges them, marks `email_confirmed_at`, then redirects to `/login`.
4. The user logs in normally.

If the link expired (default ~24h), the login screen shows the error below and
offers a resend button:

```ts
// app/api/v1/auth/resend-verification/route.ts
await supabase.auth.resend({
  type: 'signup',
  email,
  options: { emailRedirectTo: `${origin}/login` },
});
return NextResponse.json({ success: true }); // generic — cannot probe addresses
```

```tsx
// app/(auth)/login/page.tsx — shown when the API returns the unverified error
{needsVerification && (
  <button type="button" onClick={handleResend}>Resend verification email</button>
)}
{resendSent && <p>Verification email sent — please check your inbox.</p>}
```

---

## 5. Login Flow

**Route:** `POST /api/v1/auth/login` · **UI:** `app/(auth)/login/page.tsx`

```
Enter email + password (+ optional Remember me)
        │
        ▼
POST /auth/login  (email/password validated by zod)
        │
        ├─ locked out? (5 failed attempts / 15 min per email+IP) → HTTP 423
        │
        ▼
supabase.auth.signInWithPassword({ email, password })
        │
        ├─ error.code === 'email_not_confirmed'
        │     → HTTP 403 "Please verify your email address…"
        │       + UI shows "Resend verification email"
        │       (does NOT count toward the lockout counter)
        │
        ├─ other error → HTTP 401 "Invalid email or password"
        │                 (remaining-attempts hint when ≤2 left)
        │
        ▼ SUCCESS
Profile lookup by auth user id
        ├─ missing → auto-create profiles row from user_metadata
        │             (role = seller iff metadata.role/userType === 'seller')
        └─ found   → use it
        │
        ▼
Sync app_metadata.role (so edge middleware can route by role)
        │
        ▼
Set cookies: em_active (30 min sliding) and em_remember (30 days when remembered)
        │
        ▼
Client redirects: admin → /admin/dashboard · seller → /seller/dashboard ·
                  buyer → "/" (or ?next=<safe-path>)
```

Session refresh itself is handled by the Supabase SSR cookie adapter
(`lib/supabase/server.ts`) plus the proxy middleware — no manual token code.

---

## 6. Password Reset Flow

E-Mart uses Supabase's native **recovery-link** flow (no codes).

### Step 1 — Request (`app/api/v1/auth/forgot-password/route.ts`)

```ts
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/reset-password`,
});
// Always returns the same generic message whether or not the account exists
// → prevents account enumeration.
```

### Step 2 — Set new password (`app/(auth)/reset-password/page.tsx`)

This is the **only place that uses the browser Supabase client**, because the
recovery tokens arrive in the page URL and must be exchanged in the browser:

```ts
useEffect(() => {
  const supabase = createClient();
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') markValid();   // link exchanged
  });
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session) markValid();
  });
  return () => data.subscription.unsubscribe();
}, []);
```

Then a normal form calls `supabase.auth.updateUser({ password })` and signs
out, sending the user to `/login`. Invalid/expired links land on a
*"Request a New Link"* screen pointing back to `/forgot-password`.

---

## 7. Formspree Integration

### 7.1 Setup recap

- Endpoint lives in the Formspree dashboard → your form → **Integration** tab:
  `https://formspree.io/f/mzepqqee`.
- Enable **email notifications** (Formspree → Settings) and **spam protection**
  (honeypot + reCAPTCHA options are dashboard toggles).
- Submissions also appear under **Submissions** in the dashboard for debugging.

### 7.2 How E-Mart uses it

| Touchpoint | Mechanism |
|---|---|
| Registration notice | Client-side fire-and-forget POST on signup success |
| Contact form | Server-side forwarding inside `/api/v1/contact` |

The contact route keeps our own validation/throttle/honeypot, then tries two
channels — either succeeding delivers the message:

```ts
// app/api/v1/contact/route.ts (condensed)
const recipient = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM;
let resendOk = false;
if (recipient) resendOk = (await sendEmail({ ... })).sent;

const formspreeOk = await forwardToFormspree({ name, email, subject, message });

if (!resendOk && !formspreeOk) return 502 "Failed to send your message.";
return NextResponse.json({ success: true });
```

UX states on the contact page: idle → *sending* (disabled button) → success
alert, or inline error while preserving input. Logged-in users could pre-fill
their email from `useCurrentUser()`; today the field starts empty by design so
visitors can write on behalf of others.

---

## 8. End-to-End Workflow Diagram

```
User visits E-Mart
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│ REGISTER                                                  │
│  1. Fill name / email / password / role / phone           │
│  2. POST /auth/register → supabase.auth.signUp            │
│  3. Supabase emails "Confirm your email" link             │
│  4. Screen: "Check Your Email"                            │
│  5. (side-effect) Formspree notifies the owner            │
└──────────────────────────────────────────────────────────┘
        │ click link
        ▼
   Email confirmed → redirect to /login
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│ LOGIN                                                     │
│  • Unconfirmed address → 403 + "Resend verification"      │
│  • Wrong credentials   → 401 (lockout after 5 tries)      │
│  • Success → profile ensured → role cookie → dashboard    │
└──────────────────────────────────────────────────────────┘
        │
        ▼
Logged-in state: browse, cart, checkout, orders, reviews…
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│ CONTACT FORM                                              │
│  1. Validate + honeypot + 5-per-15-min IP throttle        │
│  2. Resend (if configured) OR Formspree forward           │
│  3. Success alert; owner receives email                   │
└──────────────────────────────────────────────────────────┘

Forgot password? → /forgot-password → recovery email
                 → /reset-password → updateUser({password}) → /login
```

---

## 9. Testing & Debugging

### Localhost

```bash
npm run dev            # http://localhost:3000 (allow-listed in Supabase)
npx tsc --noEmit && npm run lint && npm run build
```

1. Register a **real address you control** → expect the verification email.
2. Try logging in **before** confirming → expect the 403 message + resend button.
3. Click the link → confirm → log in → check redirect by role.
4. Forgot-password round-trip: request → open link in the same browser → set
   new password → log in with it.
5. Contact form → check the Formspree dashboard **Submissions** list.

⚠️ With built-in Supabase SMTP you will exhaust the ~2 emails/hour quota fast.
Configure custom SMTP (§2.3) or use the **Supabase Dashboard → Authentication →
Users** panel to manually confirm test users while developing.

### Production

- Repeat the above on `https://e-mart-gules.vercel.app`.
- Verify `NEXT_PUBLIC_SITE_URL` is set in Vercel and you redeployed after adding it.
- Emailed links must land on the vercel.app domain (Site URL fallback otherwise).

### Common errors

| Symptom | Cause | Fix |
|---|---|---|
| Login says “verify your email” | Address not confirmed | Click email link / use Resend button |
| Resend does nothing visible | Built-in SMTP hourly quota hit | Custom SMTP or wait/manual confirm |
| Verification link 404s / goes home | Redirect URL not in allow-list | Add exact origin to Redirect URLs |
| `user_already_exists` on signup | Duplicate registration | Log in or use password reset |
| Reset link says “invalid/expired” | Tokens older than expiry or already used | Request a fresh link |
| Contact form 502 | Both Resend misconfigured AND Formspree unreachable | Check `RESEND_API_KEY`/`CONTACT_EMAIL`; test endpoint URL |

### Logs

- **Supabase:** Dashboard → Authentication → Logs (auth events), plus Logs →
  API for database calls.
- **Formspree:** Dashboard → your form → Submissions (payloads + spam flags).
- **Vercel:** Deployment → Functions logs show our API-route `console.error`s
  (e.g. `[contact] Resend delivery failed: …`).
- **Browser:** Network tab — our endpoints return JSON errors shaped
  `{ error: string | { fieldErrors… } }`.

---

## 10. Security & Best Practices

Implemented in this repo:

- ✅ **No service key in the browser** — `createAdminClient()` (service role) is
  imported only by API routes/server libs. Anon keys are public by design.
- ✅ **Server-side validation everywhere** — zod schemas in
  `lib/validation/schemas.ts` gate every auth/contact payload.
- ✅ **Brute-force protection** — 5-failures/15-min login lockout keyed by
  email+IP (`login/route.ts`); unconfirmed-login attempts excluded.
- ✅ **Enumeration resistance** — forgot-password and resend endpoints always
  answer generically; duplicate-signup uses a single clear 409.
- ✅ **Contact honeypot + throttle** — hidden `company` field silently swallows
  bots; max 5 messages/15 min/IP.
- ✅ **Credentials never touch browser storage** — registration payloads go
  straight to our API; only non-sensitive state lives client-side.
- ✅ **RLS enabled** on all Supabase tables (see `supabase/migrations/*`);
  writes that need elevation go through service-role server code.
- ✅ **HTTPS** automatic on Vercel; Supabase cookies are `httpOnly`, `secure`
  in production, `sameSite=lax`.

Developer rules:

1. Secrets live in `.env.local` (never committed) and Vercel env vars.
2. Never add a Supabase call to a `'use client'` file except the reset-password
   token exchange documented in §6.
3. Keep all new auth mutations behind `/api/v1/auth/*` routes so lockouts,
   validation, and logging stay centralized.

---

## 11. Design Decisions Explained

**Why Supabase Auth instead of hand-rolled JWTs?**
Sessions, refresh rotation, secure httpOnly cookie storage, email templates,
rate limiting, and timing-safe credential checks come for free. A custom JWT
stack would force us to own password hashing, token revocation, and email
deliverability — high-risk code with zero business value.

**Why Formspree instead of another custom endpoint?**
The owner needs guaranteed inbox delivery with zero infrastructure. Formspree
gives us a hosted inbox, spam filtering, retries, and a submissions archive for
a one-line fetch. Our `/api/v1/contact` still adds validation/throttling, and
Formspree acts as the delivery backstop if Resend isn't configured.

**Why do auth calls run in API routes rather than the browser?**
Centralized zod validation, IP-based lockout, role decisions server-side
(profiles can't be spoofed), and one auditable place for secrets. The single
browser-side exception (reset-password) is unavoidable because recovery tokens
arrive in the URL of a client navigation.

**Why AJAX (`fetch`) instead of native `<form>` submissions?**
No full-page reloads, JSON error handling per field, loading/disabled button
states, and programmatic redirects after success. For Formspree we send
`Accept: application/json` so it answers with JSON instead of a redirect page.

**Why a "check your email" screen instead of auto-login after signup?**
With Confirm-email enabled Supabase returns no session by design — showing the
screen matches the security model and sets the correct user expectation.

---

## 12. Final Verification Checklist

**Dashboard**

- [ ] Authentication → Providers → Email → **Confirm email = ON**
- [ ] Site URL = `https://e-mart-gules.vercel.app`
- [ ] Redirect URLs include `https://e-mart-gules.vercel.app/**` and
      `http://localhost:3000/**`
- [ ] Custom SMTP configured (or you accept the 2/hour built-in limit)
- [ ] RLS enabled on tables; service key only in server env

**Environment (Vercel + `.env.local`)**

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- [ ] `NEXT_PUBLIC_SITE_URL=https://e-mart-gules.vercel.app`
- [ ] Optional: `CONTACT_EMAIL`, `EMAIL_FROM`, `RESEND_API_KEY`

**Flows tested end-to-end**

- [ ] Register → verification email received → confirm → login OK
- [ ] Login while unconfirmed shows friendly error + Resend works
- [ ] Wrong password ×5 locks the account for 15 minutes
- [ ] Forgot-password → reset link → new password → login with it
- [ ] Seller signup lands on seller dashboard (role from metadata)
- [ ] Contact form arrives via Formspree (and/or Resend) — visible in dashboards
- [ ] Registration notifications appear in the Formspree inbox

**Quality gates**

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
