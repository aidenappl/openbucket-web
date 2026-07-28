# openbucket-web

The browser UI for OpenBucket — an S3-compatible object storage console for bucket browsing, uploads, ACLs and presigned links.

> **OpenBucket platform** · Next.js app · `openbucket.appleby.cloud`

---

## Overview

`openbucket-web` is the human-facing console for OpenBucket. It browses buckets, uploads and
downloads objects, manages folders, edits ACLs, mints presigned URLs, and administers users,
storage instances and SSO.

It is a **pure API client** — no storage logic, no S3 SDK, no database. Every read and every
mutation is an HTTP call to [`openbucket-api`](https://github.com/aidenappl/openbucket-api), which
owns the storage mechanics, the auth session and all business rules.

The central concept is a **session**: a saved connection to one bucket on one storage instance. The
active session is held in `localStorage`, and every object and folder request is scoped by it.

## Role in the OpenBucket ecosystem

| Repo | What it is |
|------|-----------|
| [`openbucket-api`](https://github.com/aidenappl/openbucket-api) | Go API — the only backend this app calls |
| **`openbucket-web`** | **This repo** — the browser console |
| [`openbucket-mcp`](https://github.com/aidenappl/openbucket-mcp) | Same admin surface, exposed to Claude Code |
| [`openbucket-go`](https://github.com/aidenappl/openbucket-go) | Go SDK |
| [`openbucket-cli`](https://github.com/aidenappl/openbucket-cli) | Command-line client |

Authentication is delegated to the API, which federates to an OAuth2/OIDC provider. The login page
renders whatever `/auth/sso/config` returns, so the app is provider-agnostic.

## Tech stack

- **Next.js 15** (App Router, `output: "standalone"`) + **React 19** + **TypeScript** (`strict`)
- **Tailwind CSS v4** with CSS custom properties — light and dark
- **Redux Toolkit** for session/upload state, **React context** for auth and theme
- **Axios** via a single typed `fetchApi<T>` wrapper
- **Font Awesome Pro** icons, **Inter** via Google Fonts
- **Vitest** + Testing Library
- Components are hand-rolled — no component library

## Getting started

### Prerequisites

- Node.js 20+
- A running `openbucket-api` (local or the deployed instance)
- `mkcert` — for local HTTPS, installed by the setup command below
- `NPM_TOKEN` exported in your environment. `.npmrc` points `@fortawesome` at
  `npm.fontawesome.com` and authenticates with it; without it `npm install` fails with a
  misleading npmjs.com **E401**.

### Setup

```bash
npm install
dev setup-local     # mkcert + certs + /etc/hosts entry for openbucket.local.appleby.cloud
dev dev             # HTTPS dev server
```

Then open **https://openbucket.local.appleby.cloud:3010** (the HTTPS harness in `server.js` binds
that hostname and port; plain `dev dev-http` uses 3000).

> **HTTPS is not optional for development.** The API sets cookies with `withCredentials`, and
> browsers drop them over plain HTTP on a bare `localhost`. `dev dev-http` starts faster but you
> will not be able to log in.

`NEXT_PUBLIC_OPENBUCKET_API` must point at your API. It is read at **build** time for production
images, so changing it there requires a rebuild rather than a restart.

## Development

| Command | What it does |
|---------|--------------|
| `dev dev` | HTTPS dev server — use this |
| `dev dev-http` | Plain HTTP dev server; cookies will not work |
| `dev setup-local` | One-time mkcert + `/etc/hosts` setup |
| `dev build` | Production build |
| `dev start` | Serve the production build |
| `dev test` | Vitest suite |
| `dev lint` | ESLint |
| `dev typecheck` | `tsc --noEmit` |
| `dev check` | lint + `prettier --check` + typecheck |

All three of `dev build`, `dev test` and `dev check` must pass before work is considered done.

## Project structure

```
src/
  app/             # App Router — one folder per route, plus api/health for the Docker healthcheck
  components/      # from-scratch UI primitives and feature components
  context/         # AuthContext (session + role gating), ThemeContext
  hooks/           # useBucketData, useBucketActions, useSelection, usePermissions, …
  services/        # one {entity}.service.ts per domain; every function prefixed req*
  store/           # Redux Toolkit — authSlice, sessionSlice, uploadSlice
  tools/           # axios.tools.ts (the API client), formatters, sessionStore, url helpers
  types/           # domain types + ApiResponse/ApiSuccess/ApiError
  __tests__/       # Vitest specs
```

## Deployment

Self-hosted Docker, **not** Vercel.

On a push to `main`, CI builds a multi-stage image to
`registry.appleby.cloud/openbucket-web:latest` and then triggers a redeploy on **Lattice**. The
runtime is `node:20-alpine` with a non-root user, `EXPOSE 3000`, and a `HEALTHCHECK` against
`/api/health`.

Because this stack deploys per-container, Lattice's container record can show a stale `started_at`
after a successful deploy. To confirm a rollout, check the deploy token's `last_used_at`, the
container's boot logs, and the live URL — and expect a brief 502 while the container recreates.

## Contributing & further reading

- **[AGENTS.md](./AGENTS.md)** — the full contributor and agent guide: page map, service map, auth
  model, operational gotchas, and the rules for this repo. Read it before changing code.
- [`openbucket-api`](https://github.com/aidenappl/openbucket-api) — the API this app consumes
- [`openbucket-mcp`](https://github.com/aidenappl/openbucket-mcp) — adding an API route should add
  or consciously skip a tool there in the same change
