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
    layout.tsx                # "use client" root: providers, skip link, Navigation, <main>, token-styled
                              # Toaster, theme boot script (no footer — matches keyring/lattice)
    globals.css               # Inter @import + Tailwind v4 + the shared design-token layer
    page.tsx                  # "/" bucket browser
    <feature>/page.tsx        # one page per feature (see Page map)
  components/                 # feature components — PascalCase (Navigation, SessionSwitcher,
                              # UploadTracker, ObjectThumb, ObjectInspectPanel, *Modal, …)
    ui/                       # Shared primitives (kebab-case): from lattice-web — button, input,
                              # alert, badge, modal, switch; from keyring-web — table, checkbox,
                              # search-input, page-header (+ Card), copy-button; plus menu
                              # (portal row-actions menu) and select
    admin/                    # Instances page panels: CredentialsPanel, BucketsPanel, AddSessionsModal
  lib/utils.ts                # cn() — dependency-free class joiner
  context/                    # AuthContext (session + role gating), ThemeContext (light/dark/system)
  hooks/                      # useBucketData, useSelection, useSort, useUploader, useDismiss,
                              # usePermissions, useViewFormat, useProgressiveCount
  services/                   # one {entity}.service.ts per domain (see Service map)
  store/                      # Redux Toolkit — index.ts, hooks.ts, StoreProvider.tsx
    slices/                   # authSlice, sessionSlice, uploadSlice
  tools/                      # axios.tools.ts (THE client), formatBytes, formatDate,
                              # sessionStore (localStorage), url (endpointHost), objectUrl (prefix
                              # normalising, public/signed links, download, open), sso.tools.ts
                              # (silent SSO, return_to, sign-out)
  types/                      # index.ts (domain + ApiResponse/ApiSuccess/ApiError), user.types.ts
  __tests__/                  # adminService, authService, authSlice, axios + setup.ts
```

### The shared design-token layer and `components/ui/`

`globals.css` carries a token layer **ported from lattice-web** so monitor-web, lattice-web,
keyring-web and openbucket-web are one design language rather than four. Surface,
border, text, semantic-accent and radius families are defined as CSS custom properties and bridged
into Tailwind utilities through `@theme inline` — `bg-surface`, `text-secondary`,
`border-border-strong`, `text-healthy` and so on.

**⚠️ THE POLARITY IS THE OPPOSITE OF LATTICE-WEB'S, DELIBERATELY.** lattice-web is dark-first: it
defines dark values in `:root` and light in `:root:not(.dark)`. This app is light-first and every
existing page is written as `bg-white dark:bg-zinc-900`. So the same token NAMES carry light values
in `:root` and dark values in `.dark`. Components written against the tokens are portable between
the apps unchanged — which is the point — while pages written against zinc utilities are untouched.
**Do not "fix" this to match lattice.** Flipping it inverts the entire dashboard.

`src/components/ui/` holds the shared primitives (see the tree above). `src/lib/utils.ts` has a dependency-free `cn()` — deliberately not clsx + tailwind-merge,
because the primitives put `className` last in every `cn(...)` call, so a caller's utility already
wins without a merge step.

Two things differ from lattice's originals on purpose:

- `Button`'s `primary` variant is the accent fill, not `bg-white text-black`. White-on-white is
  invisible in a light-first app.
- `Input` generates an `id` when none is passed (lattice's renders `htmlFor={undefined}`, a label
  bound to nothing) and wires `aria-invalid` + `aria-describedby` for its error.

**Every page is on the tokens and `ui/` primitives** (the October 2026 tophat converted the
explorer, object, sessions, account and all admin pages; `/pending` and `/unauthorized` are the
only pages still on raw zinc utilities). New UI uses `ui/` — every dialog goes through `ui/modal`
(focus trap, Escape, focus restore), every table through `ui/table`, every row-actions menu through
`ui/menu` (it portals, so it isn't clipped by the table's `overflow-x-auto`).

The pre-token components (`Button`, `Input`, `Checkbox`, `MajorButton`, `GridItem`, `Dropdown`,
`ToggleSelector`, `DragDropUpload`, `Footer`, and the `useBucketActions` / `useBreadcrumbs` hooks)
were deleted in the same change. Don't reintroduce PascalCase duplicates of `ui/` primitives.

**Deviations from the global standard, both deliberate:**
- The axios wrapper lives in **`tools/axios.tools.ts`**, not `services/api.service.ts`. That's the
  older of the two conventions the standard allows; it is what every service here imports.
- State is split between **Redux** (sessions, uploads, auth mirror) and **React context**
  (`AuthContext` is the actual gate). Don't add a second source of truth for auth.

## 4. Page map

| Route | File | What it does |
|---|---|---|
| `/` | `page.tsx` | Explorer — `?folder=<prefix>` (pushed, so Back goes up a folder). List (sortable, filter with `/`) or grid (lazy image thumbnails); multi-select with Shift ranges and ⌘/Ctrl+A; bulk access/download/move/delete; per-row menu (details, open, download, copy link, share link…, access, rename, move to…, delete); upload files or a folder (button or whole-window drop; folders keep their structure) with overwrite prompt; new folder in the current prefix. Move uses a folder-browser dialog and skips name clashes unless Replace is ticked |
| `/object/[...object]` | `object/[...object]/page.tsx` | Single object — download, open, copy link (public URL or 24h signed), access, rename, move, delete; details incl. public URL, grants, metadata; preview |
| `/sessions` | `sessions/page.tsx` | Bucket sessions — create/edit/remove, filter, active marker; new/edited sessions are probed (folder list) so bad keys are reported at once |
| `/account` | `account/page.tsx` | Own profile — display name; password for local accounts (`PUT /auth/self`) |
| `/login` | `login/page.tsx` | Local email/password **+** SSO button. See Login layout below |
| `/pending` | `pending/page.tsx` | Landing for `role: "pending"` — account awaiting approval |
| `/unauthorized` | `unauthorized/page.tsx` | Landing on `error_code 4003` |
| `/admin` | `admin/page.tsx` | Overview — user/pending/instance/token counts, instance health, sign-in summary |
| `/admin/users` | `admin/users/page.tsx` | Users — filter/search/sort, create local user, role change and deactivate/reactivate (confirmed; you can't change or deactivate yourself). "Delete" in the API is a soft deactivate, so the UI says Deactivate |
| `/admin/instances` | `admin/instances/page.tsx` | openbucket-go servers — add/edit/(de)activate/remove; per instance: credentials (secret shown once, in a modal), buckets (create with owner key, confirmed ACL change, typed-name delete, grants via key picker), add buckets as sessions |
| `/admin/tokens` | `admin/tokens/page.tsx` | `obk_` API tokens — list (owner, last used, expiry), create (plaintext shown once), revoke |
| `/admin/sso` | `admin/sso/page.tsx` | SSO provider config |
| `/api/health` | `api/health/route.ts` | Liveness for Docker |

## 5. Service map

Every function is prefixed **`req`** and returns `ApiResponse<T>`. Services declare functions as
`const` and export them via a **trailing `export { … }` barrel** — match that style.

| Service | Functions |
|---|---|
| `auth.service.ts` | `reqLogin`, `reqRefresh`, `reqLogout`, `reqGetSelf`, `reqUpdateSelf`, `reqGetSSOConfig` |
| `session.service.ts` | `reqGetSessions`, `reqPostSession`, `reqDeleteSession`, `reqProbeSession` |
| `bucket.service.ts` | `reqFetchBucketHead` |
| `folder.service.ts` | `reqListContents` (one level: folders + objects, takes the session id), `reqFetchFolders`, `reqFetchFolderContents`, `reqPostFolder`, `reqRenameFolder`, `reqDeleteFolder` |
| `object.service.ts` | `reqFetchObjects`, `reqFetchObjectHead`, `reqFetchBulkObjectHead`, `reqFetchObjectACL`, `reqPutObjectACL`, `reqPutBulkObjectACL`, `reqFetchObjectPresign`, `reqDownloadObject`, `reqPutRenameObject`, `reqPutObjectWithProgress`, `reqDeleteObject` |
| `admin.service.ts` | Users: `reqAdminListUsers`, `reqAdminCreateUser`, `reqAdminUpdateUser`, `reqAdminDeleteUser` · Instances: `reqAdminListInstances`, `reqAdminCreateInstance`, `reqAdminUpdateInstance`, `reqAdminDeleteInstance` · Proxy: `reqProxyListCredentials`, `reqProxyCreateCredential`, `reqProxyDeleteCredential`, `reqProxyListBuckets`, `reqProxyGetBucket`, `reqProxyCreateBucket`, `reqProxyDeleteBucket`, `reqProxyGetBucketStats`, `reqProxyUpdateBucketACL`, `reqProxyListGrants`, `reqProxyCreateGrant`, `reqProxyDeleteGrant` · API tokens: `reqAdminListApiTokens`, `reqAdminCreateApiToken`, `reqAdminRevokeApiToken` · SSO: `reqAdminGetSSOConfig`, `reqAdminUpdateSSOConfig` |

### Storage contracts that have bitten this app

Each of these was a shipped bug found in the October 2026 tophat. The code carries a comment at
the fix; this is the index.

- **Folder keys are full keys.** `POST /folder {folder}` creates exactly that key — it does not
  prepend the current prefix. The explorer used to send the bare name, so "New folder" inside
  `a/b/` created it at the root. Prefixes are normalised (no leading `/`, one trailing `/`) by
  `normalizePrefix` — `GET /folders` does **not** normalise, and `?folder=a/b` listed `b` inside itself.
- **Bulk HEAD and bulk ACL take at most 100 keys** ("batch size exceeds maximum of 100").
  `reqFetchBulkObjectHead`/`reqPutBulkObjectACL` chunk, and run 4 chunks at a time
  (`mapLimited`) — a 10,000-object folder is 100 batches. Bulk HEAD returns results **in request
  order** with `null` gaps — match by index, never by ETag (identical files share one).
- **One listing per folder: `GET /contents`** (`reqListContents`) returns `{folders, objects}`.
  The explorer and the move dialog used to call `/folders` and `/objects` for every folder — the
  API listed the same prefix twice. Keep new folder views on `/contents`.
- **Listings are capped at 10,000 and say so.** `GET /contents` / `/objects` / `/folders` add
  `pagination: {truncated, limit}`; `fetchApi` passes it through as `ApiSuccess.pagination`, and
  the explorer shows a "only the first N" warning (`useBucketData().truncatedAt`). Until October
  2026 listings actually stopped at **1,000** with no signal — openbucket-go never returned a
  continuation token (fixed in openbucket-go#29) — so `atlas/hotels/` showed 994 of 2,993 folders.
- **Downloads stream through the API** (`GET /core/v1/{id}/object`, `reqDownloadObject`). The
  storage CDNs send **no CORS headers**, so `fetch()` of a presigned URL is blocked — the old
  Download button did nothing for every file. Files over 200 MB open a presigned URL instead (the
  API's 60 s write timeout).
- **Uploads have no client timeout** (`timeout: 0`); the client-wide 10 s timeout used to fail any
  upload slower than that. The API's own `ReadTimeout` (15 s) still caps slow uploads server-side.
- **`endpoint` already has its scheme.** Public URLs are `publicObjectUrl()` — path-style
  `<endpoint>/<bucket>/<key>`. Building `https://${endpoint}` produced `https://https://…`.
- **`GET /folder` is snake_case** (`key`, `size`, `last_modified` — `aws.Object`), unlike every
  other listing (PascalCase S3 shapes).
- **Known openbucket-go bugs the UI works around:** folder **rename** fails (CopyObject can't copy a
  folder-marker key — "is a directory"), so the folder menu has no Rename; folder **delete**
  (multi-object delete) can answer 200 while objects stay listed (files removed, metadata rows
  kept), so the explorer re-lists after a folder delete and says so if anything remains.
- **Presigned URLs are capped at 24 h.** Over-cap requests are clamped to 24 h (until
  openbucket-api#16 they silently became 1 h). The share dialog offers 15 min / 1 h / 1 day and
  shows the expiry the API reports (`data.expiration`), never the one requested.
- **Rename/move can't overwrite.** openbucket-go's CopyObject refuses an existing destination
  (`ObjectAlreadyExists`, surfaced as 500 "Unknown error"), unlike S3. Move-with-replace deletes
  the target first, then renames; the source is untouched until the rename succeeds.
- **Upload keys may contain `/`.** Folder uploads send `key=<relative path>` with the current
  `prefix`; the API only rejects `..`, a leading `/` and NUL. Folder markers aren't created, so a
  folder exists while it has objects and vanishes when emptied. Uploads run 4 at a time
  (`useUploader`); a dropped folder is walked with `webkitGetAsEntry` (`tools/dropEntries.tools.ts`).

## 6. Domain & architecture

**Sessions are the core concept.** A *session* is a saved connection to one bucket on one storage
instance (`/core/v1/session[s]`). The **active** session lives in `localStorage` via
`tools/sessionStore.tools.ts`, not in a cookie — so it survives reloads but is per-browser, and
every object/folder call is scoped by it. Losing it, not an auth failure, is the usual cause of an
empty bucket view.

**Views are stale-while-revalidate.** Folder listings (`useBucketData`) and object views (the
object page) are cached in memory per tab (`tools/viewCache.tools.ts`, 100 entries, keyed
`${sessionId}:${prefix|key}`). **Folder listings are also persisted** to localStorage (newest 30,
≤2 MB, debounced; `ob-view-cache:*`), so a reload or new tab paints the last-known folder at once.
`clearPersistedViews()` runs on sign-out and on a failed auth check — persisted listings must never
outlive the signed-in user; anything new that persists view data goes through `ViewCache`. A revisit renders the cached copy on the first frame and refreshes in
the background — the explorer's Refresh icon spins while it does; only a first visit shows
skeletons. Mutations call the same refresh, so the cache is rewritten after every change; delete
and move drop the object's entry. Two rules keep it honest:
- **Resolve what to show during render, keyed by (session, path)** — never from state alone.
  The URL changes before any effect runs, so state-only views painted the previous folder's rows
  (or object's details) under the new title for a frame, and the object cache-write effect filed
  the old object under the new key.
- **Navigation is near-instant on purpose:** hovering or focusing a folder link calls
  `prefetchListing` (one request per folder in flight, shared with the real load), and navigating
  reuses a listing younger than `FRESH_MS` (10 s) instead of listing again — Refresh and every
  mutation still force a fetch. Big folders render in batches (`useProgressiveCount`: 120 rows,
  then 200 per idle frame); mounting atlas `hotels/`'s 3,020 rows at once froze the page ~800 ms.
- **Folder navigation is `history.pushState`, never `router.push` or a plain `<Link>` click.**
  The folder is a search param and the explorer renders client-side, but Next's router fetched a
  server render (`?_rsc=`, ~360 ms) before even changing the URL. Folder links keep a real `href`
  (new tab works) with `prefetch={false}` and `folderLinkClick`; `useSearchParams` and Back/Forward
  follow native pushState.
- **Rows are memoised components** (`components/ExplorerRows.tsx`: `FolderRow`, `ObjectRow`,
  `GridItem`) that read handlers from a ref (`RowActions`) at event time, and `Menu` takes
  `items` as a function so menus are built only when opened. Inline rows re-rendered on every
  batch — filling `hotels/` was seconds of growing long tasks. Keep row props primitive/stable.
- **One row per key** (`newestPerKey` in `useBucketData`). openbucket-go stored a new metadata
  row on every overwrite, so listings could repeat a key; repeated React keys left orphaned rows
  on screen across navigation (dead checkboxes, empty menus). The persisted cache is
  `listings-v2` for the same reason.
- A cached preview URL is reused for 45 of its 60 minutes (new presigns change the `<img>` src and
  re-download the preview); cached heads are carried over for unchanged objects (same key + ETag).

**Auth model — cookies issued by the API:**
- `AuthContext` is the gate. On mount it **always** calls `reqGetSelf` (with `reqGetSessions` in
  parallel — they used to run back to back, delaying the first listing ~350 ms) (an SSO session is the
  HttpOnly `openbucket_session` cookie, invisible to JS, and SSO sets no `ob-logged-in` marker —
  gating on that marker bounced every freshly signed-in SSO user back to `/login`); on failure it
  redirects to `/login?return_to=<path>`.
  `PUBLIC_PATHS = ["/login", "/unauthorized"]`. A user with `role: "pending"` is pushed to
  `/pending`.
- `tools/axios.tools.ts` handles the rest: on **401** it POSTs `/auth/refresh` behind a
  **`refreshPromise` singleton** so concurrent 401s trigger exactly one refresh, then retries.
  `/auth/login` and `/auth/refresh` are exempt to avoid recursion. When the refresh fails the
  browser goes to `/login?return_to=<path>` (`redirectToLogin` in `tools/sso.tools.ts`).
  **403 + `error_code 4003`** → `/unauthorized`; **403 + `4004`** → `/pending`.
- **Roles.** `viewer` is read-only, `editor` can change bucket contents, `admin` also gets
  `/admin`. openbucket-api enforces it (`RequireEditor` on every mutating bucket route → 403
  `editor access required`, `error_code 1000`, which surfaces as a normal error toast, not a
  redirect). The UI mirrors it with `useCanWrite()` (`hooks/usePermissions.ts`): for viewers the
  explorer and object page hide upload, new folder, access, rename, move and delete, disable the
  drop zone, and show a "Read-only" marker. Hiding is cosmetic — the API is the boundary.
- **SSO users have no OpenBucket JWTs.** `openbucket-api` holds their session server-side
  (`openbucket_session` cookie) and refreshes it against the identity provider, so it lives as
  long as the provider session. `/auth/refresh` answers 401 for them; that is the expected path to
  `/login` when the provider session has ended.
- **Silent SSO on `/login`.** With exactly one provider, `/login` first navigates to
  `<api><login_url>?prompt=none&return_to=…` (`startSilentSSO`). A user still signed in at the
  provider comes straight back signed in and never sees the form; otherwise the API redirects to
  `/login?error=login_required` and the form renders (no error shown for that code). The attempt
  is skipped when the page has `?error=`, `?signed_out=1` or `?local=1`, and at most once a minute
  (`openbucket-sso-silent-at` in `sessionStorage`) so a session that will not stick cannot loop.
- **Logout** follows `data.redirect_url` from `POST /auth/logout` (`/login?signed_out=1` — sign-out ends only this app's session; Forta and other apps stay signed in) or lands on `/login?signed_out=1` (`finishSignOut`).
- `withCredentials` is on, so **local dev must be HTTPS on a `.local.appleby.cloud` subdomain** or
  cookies are silently dropped. That's what `dev dev` / `npm run dev:ssl` is for — `server.js`
  binds `openbucket.local.appleby.cloud:3010`. Plain `npm run dev` (port 3000, HTTP) cannot log in.
  `server.js` loads `NEXT_PUBLIC_OPENBUCKET_API` from Keyring; with no `KEYRING_*` credentials, set
  it yourself or every call 404s against the dev server. The production API allows this origin, so
  `NEXT_PUBLIC_OPENBUCKET_API=https://api.openbucket.appleby.cloud dev dev` works against real data.

**Login layout — shared across the ecosystem.** `/login` uses the **shared Appleby Cloud login
layout**, identical in structure to `forta-login`, `monitor-web` and `lattice-web`: full-screen
centred `<main>`, a brand row (40px logo tile + product name + hairline + "Appleby Cloud"), a
bordered card holding "Sign in to continue" → labelled fields → primary button → `or continue
with` divider → SSO button, and a `© <year> Appleby Cloud` footer. Colours are OpenBucket's own
(blue primary); **the structure and spacing must not diverge** — change it in all four repos or
not at all. The root layout hides `Navigation` and `Footer` on `/login` via `BARE_ROUTES` so the
page owns the viewport; add any future full-screen route to that list.

> ### ⚠️ `/auth/sso/config` — accept the response on `providers` OR `enabled`
>
> `enabled`, `button_label` and `login_url` are **legacy** fields `openbucket-api` still emits
> beside the shared `providers` contract. Gating the fetch solely on `res.data.enabled` — which
> this page did — is a latent outage: the day the API drops it, the payload is discarded,
> `setSsoConfig` never fires, and every SSO button vanishes from the login page while
> `providers` sits unread in the very response being thrown away. `monitor-web` shipped that
> exact bug and locked SSO-only users out of Monitor on 2026-08-07 — silently, with no error and
> no empty state.
>
> The provider derivation already prefers `providers` and falls back to the legacy shape. Keep
> the gate permissive so it can reach it, and delete the fallback only once every API has
> stopped serving the legacy fields.

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
| `openbucket-go` | The S3-compatible storage server — what Admin → Instances manages (via the API's `/admin/instances/{id}/proxy/*`) and what sessions point at |
| `openbucket-cli` | CLI over the same API |
| `keyring-js` | Supplies build/runtime secrets |
| `forta-*` | The SSO provider currently configured (the login button reads "Sign in with Forta") — but this app is **provider-agnostic**; it renders whatever `/auth/sso/config` returns |

## 9. Operations

- **CI runners:** every GitHub Actions job runs on `[self-hosted, lattice-worker]` — a
  single-use runner started by `aidenappl/gh-runner-broker` on the CI host (`aplb-actions`,
  10.15.10.78), with the toolchain and shared Go/npm caches provisioned by
  `TeamTrailblaze/runner-setup`. Images build through the host's `lattice-builder` BuildKit
  (`builder: lattice-builder`), never `docker/setup-buildx-action`, which races other runners
  on the shared Docker daemon; its local layer cache replaces the gha cache. `setup-go` runs
  with `cache: false`. Jobs stuck in "Queued" mean the broker or the host is down — check the
  `gh-runner-broker` service in Monitor (zone `appleby`).

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
- Deploys go through CI, not by hand from here. A push/merge that triggers one happens **only after
  asking Aiden and getting an explicit yes** (see `~/CLAUDE.md` *Ask-first actions*); verify it
  landed afterward using the signals above.

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
