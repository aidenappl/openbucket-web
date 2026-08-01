# AGENTS.md — openbucket-web

> `openbucket-web` is the **Next.js 15 browser UI for OpenBucket**, the S3-compatible object
> storage platform on `appleby.cloud`. It is the human-facing counterpart to
> [`openbucket-mcp`](https://github.com/aidenappl/openbucket-mcp): both drive the same
> [`openbucket-api`](https://github.com/aidenappl/openbucket-api) surface, one for Claude Code and
> one for a person in a browser at `openbucket.appleby.cloud`. This app owns **bucket browsing,
> object upload/download/rename/delete, ACLs and presigned links, folders, sessions, users,
> instances and SSO config** — every read and every mutation is an HTTP call to `openbucket-api`.
>
> **⚠️ Golden rule — keep this file current:** any change that adds/removes a page or route, adds
> or retypes a service function, changes the Redux store shape, alters the auth model, or drifts
> from `openbucket-api`'s route surface MUST update this AGENTS.md in the SAME change. Per the
> global standard: **docs ship with the code, not as a follow-up commit.**

---

## 1. What this repo is

A **Next.js 15 App Router** application — the browser console for OpenBucket. It is a **pure API
client**: no storage logic, no database, no S3 SDK. Everything an operator sees — pagination,
validation messages, ACL semantics, presign expiry — is produced by `openbucket-api` and merely
presented here.

It **owns**: the UI, the Redux cache of session/upload state, the browser auth session lifecycle
(login form, cookie session, deduplicated token refresh, role gating), the from-scratch component
library, the multi-file upload tracker, and the local HTTPS dev harness.

It does **not** own:
- **Storage mechanics or the S3 protocol** — those live in `openbucket-api` / `openbucket-go`.
- **Authentication issuance** — `openbucket-api` issues the session cookies and runs the SSO
  (OAuth2/OIDC) flow; this app presents the login form and manages refresh timing.
- **Any business rules.** If a mutation is rejected, the reason came from the API.

## 2. Stack & dependencies

Pinned in `package.json` (`version: 0.1.0`, `private: true`).

| Area | Choice | Version | Notes |
|------|--------|---------|-------|
| Framework | **Next.js** | `^15.5.9` | App Router only, `output: "standalone"` |
| UI runtime | **React** / react-dom | `^19.0.0` | React 19 |
| Language | **TypeScript** | `^5` | `strict`, path alias `@/* → ./src/*` |
| State | **Redux Toolkit** + react-redux | `^2.8.2` / `^9.2.0` | 3 slices, `StoreProvider` singleton |
| HTTP | **Axios** | `^1.10.0` | single `fetchApi<T>` wrapper, `validateStatus: () => true` |
| Styling | **Tailwind CSS v4** | `tailwindcss ^4`, `@tailwindcss/postcss ^4` | CSS custom properties, light + dark |
| Icons | **Font Awesome Pro** | `pro-solid-svg-icons ^6.7.2` | ⚠️ private registry — see Font Awesome auth below |
| Fonts | **Inter** | via Google Fonts `@import` in `globals.css` | not `next/font` |
| Toasts | **react-hot-toast** | `^2.5.2` | global `<Toaster>` in the root layout |
| Skeletons | **react-loading-skeleton** | `^3.5.0` | CSS imported in the root layout |
| Spinners | **react-spinners** | `^0.17.0` | |
| Dates | **dayjs** | `^1.11.14` | |
| Cookies | **js-cookie** | `^3.0.5` | |
| IDs | **uuid** | `^11.1.0` | upload item keys |
| Secrets | **@aidenappleby/keyring-js** | `^1.0.0` | `serverExternalPackages` in `next.config.ts` |
| Tests | **Vitest** + Testing Library | `vitest ^4.1.5`, `jsdom ^29.0.2` | `src/__tests__/setup.ts` |

## 3. Project structure

Flat `src/` tree under the App Router. Path alias `@/` → `src/`.

```
src/
  app/
    api/health/route.ts       # GET /api/health → {status:"ok"} — the Docker HEALTHCHECK hits this
    layout.tsx                # "use client" root: providers, Navigation, Footer, Toaster, theme boot script
    globals.css               # Inter @import + Tailwind v4 + the shared design-token layer
    page.tsx                  # "/" bucket browser
    <feature>/page.tsx        # one page per feature (see Page map)
  components/                 # 21 from-scratch primitives + feature components — PascalCase
    ui/                       # Shared primitives ported from lattice-web — button, input, alert,
                              # badge, modal, switch (kebab-case, matching lattice)
  lib/utils.ts                # cn() — dependency-free class joiner
  context/                    # AuthContext (session + role gating), ThemeContext (light/dark/system)
  hooks/                      # useBucketData, useBucketActions, useSelection, useBreadcrumbs,
                              # usePermissions, useViewFormat
  services/                   # one {entity}.service.ts per domain (see Service map)
  store/                      # Redux Toolkit — index.ts, hooks.ts, StoreProvider.tsx
    slices/                   # authSlice, sessionSlice, uploadSlice
  tools/                      # axios.tools.ts (THE client), formatBytes, formatDate,
                              # sessionStore (localStorage), url
  types/                      # index.ts (domain + ApiResponse/ApiSuccess/ApiError), user.types.ts
  __tests__/                  # adminService, authService, authSlice, axios + setup.ts
```

### The shared design-token layer and `components/ui/`

`globals.css` carries a token layer **ported from lattice-web** so the SSO surfaces across
monitor-web, lattice-web and openbucket-web are one design language rather than three. Surface,
border, text, semantic-accent and radius families are defined as CSS custom properties and bridged
into Tailwind utilities through `@theme inline` — `bg-surface`, `text-secondary`,
`border-border-strong`, `text-healthy` and so on.

**⚠️ THE POLARITY IS THE OPPOSITE OF LATTICE-WEB'S, DELIBERATELY.** lattice-web is dark-first: it
defines dark values in `:root` and light in `:root:not(.dark)`. This app is light-first and every
existing page is written as `bg-white dark:bg-zinc-900`. So the same token NAMES carry light values
in `:root` and dark values in `.dark`. Components written against the tokens are portable between
the apps unchanged — which is the point — while pages written against zinc utilities are untouched.
**Do not "fix" this to match lattice.** Flipping it inverts the entire dashboard.

`src/components/ui/` holds the ported primitives: `button`, `input`, `alert`, `badge`, `modal`,
`switch`. `src/lib/utils.ts` has a dependency-free `cn()` — deliberately not clsx + tailwind-merge,
because the primitives put `className` last in every `cn(...)` call, so a caller's utility already
wins without a merge step.

Two things differ from lattice's originals on purpose:

- `Button`'s `primary` variant is the accent fill, not `bg-white text-black`. White-on-white is
  invisible in a light-first app.
- `Input` generates an `id` when none is passed (lattice's renders `htmlFor={undefined}`, a label
  bound to nothing) and wires `aria-invalid` + `aria-describedby` for its error.

**Scope is bounded on purpose.** The token layer and primitives exist app-wide; only the **SSO
admin and login surfaces** are converted to them. Other pages keep working on their current classes
and get converted opportunistically. A full restyle of the dashboard is separate work, not
something to smuggle into an auth change.

**Deviations from the global standard, both deliberate:**
- The axios wrapper lives in **`tools/axios.tools.ts`**, not `services/api.service.ts`. That's the
  older of the two conventions the standard allows; it is what every service here imports.
- State is split between **Redux** (sessions, uploads, auth mirror) and **React context**
  (`AuthContext` is the actual gate). Don't add a second source of truth for auth.

## 4. Page map

| Route | File | What it does |
|---|---|---|
| `/` | `page.tsx` | Bucket browser — object grid/list, upload, selection, breadcrumbs |
| `/object/[...object]` | `object/[...object]/page.tsx` | Single-object view — metadata, ACL, presign, rename |
| `/sessions` | `sessions/page.tsx` | Bucket sessions — create/list/delete a connection to a bucket |
| `/login` | `login/page.tsx` | Local email/password **+** SSO button. See Login layout below |
| `/pending` | `pending/page.tsx` | Landing for `role: "pending"` — account awaiting approval |
| `/unauthorized` | `unauthorized/page.tsx` | Landing on `error_code 4003` |
| `/admin` | `admin/page.tsx` | Admin index |
| `/admin/users` | `admin/users/page.tsx` | User CRUD |
| `/admin/instances` | `admin/instances/page.tsx` | Storage instance CRUD |
| `/admin/sso` | `admin/sso/page.tsx` | SSO provider config |
| `/api/health` | `api/health/route.ts` | Liveness for Docker |

## 5. Service map

Every function is prefixed **`req`** and returns `ApiResponse<T>`. Services declare functions as
`const` and export them via a **trailing `export { … }` barrel** — match that style.

| Service | Functions |
|---|---|
| `auth.service.ts` | `reqLogin`, `reqRefresh`, `reqLogout`, `reqGetSelf`, `reqGetSSOConfig` |
| `session.service.ts` | `reqGetSessions`, `reqPostSession`, `reqDeleteSession` |
| `bucket.service.ts` | `reqFetchBucketHead` |
| `folder.service.ts` | `reqFetchFolders`, `reqPostFolder`, `reqDeleteFolder` |
| `object.service.ts` | `reqFetchObjects`, `reqFetchObjectHead`, `reqFetchMultiObjectHead`, `reqFetchBulkObjectHead`, `reqFetchObjectACL`, `reqPutObjectACL`, `reqPutBulkObjectACL`, `reqFetchObjectPresign`, `reqPutRenameObject`, `reqPutObjectWithProgress`, `reqDeleteObject` |
| `admin.service.ts` | Users: `reqAdminListUsers`, `reqAdminCreateUser`, `reqAdminUpdateUser`, `reqAdminDeleteUser` · Instances: `reqAdminListInstances`, `reqAdminCreateInstance`, `reqAdminUpdateInstance`, `reqAdminDeleteInstance` · Proxy: `reqProxyListCredentials`, `reqProxyCreateCredential`, `reqProxyDeleteCredential`, `reqProxyListBuckets`, `reqProxyGetBucket`, `reqProxyCreateBucket`, `reqProxyDeleteBucket`, `reqProxyGetBucketStats`, `reqProxyUpdateBucketACL`, `reqProxyListGrants`, `reqProxyCreateGrant`, `reqProxyDeleteGrant` · SSO: `reqAdminGetSSOConfig`, `reqAdminUpdateSSOConfig` |

## 6. Domain & architecture

**Sessions are the core concept.** A *session* is a saved connection to one bucket on one storage
instance (`/core/v1/session[s]`). The **active** session lives in `localStorage` via
`tools/sessionStore.tools.ts`, not in a cookie — so it survives reloads but is per-browser, and
every object/folder call is scoped by it. Losing it, not an auth failure, is the usual cause of an
empty bucket view.

**Auth model — cookies issued by the API:**
- `AuthContext` is the gate. On mount it calls `reqGetSelf`; on failure it redirects to `/login`.
  `PUBLIC_PATHS = ["/login", "/unauthorized"]`. A user with `role: "pending"` is pushed to
  `/pending`.
- `tools/axios.tools.ts` handles the rest: on **401** it POSTs `/auth/refresh` behind a
  **`refreshPromise` singleton** so concurrent 401s trigger exactly one refresh, then retries.
  `/auth/login` and `/auth/refresh` are exempt to avoid recursion. **403 + `error_code 4003`** →
  `/unauthorized`; **403 + `4004`** → `/pending`.
- `withCredentials` is on, so **local dev must be HTTPS on a `.local.appleby.cloud` subdomain** or
  cookies are silently dropped. That's what `dev dev` / `npm run dev:ssl` is for — `server.js`
  binds `openbucket.local.appleby.cloud:3010`. Plain `npm run dev` (port 3000, HTTP) cannot log in.

**Login layout — shared across the ecosystem.** `/login` uses the **shared Appleby Cloud login
layout**, identical in structure to `forta-login`, `monitor-web` and `lattice-web`: full-screen
centred `<main>`, a brand row (40px logo tile + product name + hairline + "Appleby Cloud"), a
bordered card holding "Sign in to continue" → labelled fields → primary button → `or continue
with` divider → SSO button, and a `© <year> Appleby Cloud` footer. Colours are OpenBucket's own
(blue primary); **the structure and spacing must not diverge** — change it in all four repos or
not at all. The root layout hides `Navigation` and `Footer` on `/login` via `BARE_ROUTES` so the
page owns the viewport; add any future full-screen route to that list.

## 7. Running, building & testing

Commands come from `Devfile.yaml` via the `dev` CLI.

| Command | What it does |
|---|---|
| `dev dev` | HTTPS dev server (`npm run dev:ssl`) — **use this**; cookies need HTTPS |
| `dev dev-http` | Plain HTTP dev (`next dev --turbopack`) — cookies will **not** work |
| `dev setup-local` | One-time: mkcert + certs + `/etc/hosts` entry for `openbucket.local.appleby.cloud` |
| `dev build` / `dev start` | Production build / serve |
| `dev test` | Vitest (`vitest run`) |
| `dev lint` / `dev typecheck` | `next lint` / `tsc --noEmit` |
| `dev check` | lint + `prettier --check` + `tsc --noEmit` |

**Font Awesome auth:** `.npmrc` points `@fortawesome` at `npm.fontawesome.com` with
`_authToken=${NPM_TOKEN}`. Without `NPM_TOKEN` exported, `npm install` / `npm update` fails with a
misleading **npmjs.com E401** — the error names the wrong registry, so it reads like a public-registry
outage. Source your `.env` first. In CI the same value arrives via Keyring and is passed to the
Docker build as a `--mount=type=secret`.

## 8. Ecosystem & related repos

| Repo | Relationship |
|---|---|
| `openbucket-api` | The only backend this app talks to (`NEXT_PUBLIC_OPENBUCKET_API`) |
| `openbucket-mcp` | Same admin surface, for Claude Code. **A new API route should add or consciously skip a tool there in the same change** |
| `openbucket-go`, `openbucket-cli` | SDK / CLI over the same API |
| `keyring-js` | Supplies build/runtime secrets |
| `forta-*` | The SSO provider currently configured (the login button reads "Sign in with Forta") — but this app is **provider-agnostic**; it renders whatever `/auth/sso/config` returns |

## 9. Operations

- **Image:** `registry.appleby.cloud/openbucket-web`, built by
  `.github/workflows/build-and-deploy.yml` on push to `main`. `node:20-alpine`, two-stage,
  `output: "standalone"`, non-root `nextjs` (UID 1001), `EXPOSE 3000`, `HEALTHCHECK` on
  `/api/health`. `NEXT_PUBLIC_OPENBUCKET_API` is a **build arg** — baked into the client bundle, so
  changing it needs a rebuild, not a restart. `NPM_TOKEN` is a **build secret**
  (`--mount=type=secret`), never a layer.
- **Deploy:** the same workflow then POSTs
  `LATTICE_DEPLOY_URL?container=openbucket-web&commit=<sha>` to trigger the Lattice redeploy.
  Requires the `LATTICE_DEPLOY_URL` repo secret and an active deploy token on the Lattice stack.
- **CI:** `ci.yml` gates PRs with lint + test + build on Node 24.
- **⚠️ Verifying a deploy landed:** this stack deploys **per-container**, so Lattice writes no stack
  deployment row and **the container's `started_at` does not update** — it can read months stale
  while the container has just booted. Trust these instead: the deploy token's `last_used_at`
  (`lattice_list_deploy_tokens`), the container's boot logs (`✓ Ready in …`), and the live URL.
  A brief **502 during recreate is normal** — retry before treating it as an incident.
- **History worth knowing:** `LATTICE_DEPLOY_URL` pointed at an unresolvable host from 2026-05-09
  to 2026-07-26. Every push in that window reported a green *build* while the deploy step failed
  with `HTTP 000` (curl exit 6) and nothing shipped. If the UI looks stale, check the deploy step's
  HTTP code before anything else.
- Do **not** deploy by hand from here (repo guardrails).

## 10. Rules & guardrails

- **No ORM-style abstractions over the API** — call `fetchApi` through a `req*` service function.
- **Never add SWR / React Query / tRPC.** Data fetching is `useEffect` + `useState` + services, or
  Redux where state is shared.
- **No component libraries** (shadcn / Radix / MUI). Everything in `components/` is hand-rolled.
- **Never bypass `AuthContext`** for gating, and never add a second auth source of truth.
- **Never widen a type to `any`** to make a response fit — fix the type in `types/`.
- **Don't create or edit `.env`** — ask for the values.

## 11. Verification — always before "done"

```bash
npx next build     # or: dev build — production build + type-check; MUST pass
npm test           # or: dev test — Vitest suite
dev check          # lint + prettier --check + tsc --noEmit
```

- Fix **every** TypeScript error; `strict` is on.
- If you touched a service or slice, its `src/__tests__/*.test.ts` sibling must still pass.
- **Never report work complete on a failing build.**
- ⚠️ `vitest` must be installed for `next build` to typecheck `vitest.config.ts`. A fresh clone
  without `npm ci` fails the build with `Cannot find module 'vitest/config'` — which looks like a
  source error but isn't.

## 12. Keeping this file updated

Update this AGENTS.md **in the same change** when you:

- Add/remove/rename a page → update the **Page map**.
- Add/retype a service function → update the **Service map** (and keep the `req` prefix).
- Change the Redux store shape or the auth/refresh model → update **Domain & architecture**.
- Change commands in `Devfile.yaml` → update **Running, building & testing**.
- Change the Dockerfile, workflow, or anything about how this ships → update **Operations**.
- Add a route to `openbucket-api` → add or consciously skip the matching `openbucket-mcp` tool.
