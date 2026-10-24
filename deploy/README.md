# Cobra Deployment Configuration

This directory contains container and orchestration configurations for deploying the SvelteKit frontend alongside the Rails API backend behind an Nginx reverse proxy gateway.

The top-level `Dockerfile`, `docker-compose.yml`, and `docker-compose.deploy.yml` are still present for classic Cobra production deployment.

---

## Nginx Routing Table (Path to Server)

| Path / Pattern | Target Upstream | Handled Service | Description |
| :--- | :--- | :--- | :--- |
| `location /api/v1/` | `rails_upstream` (`rails:3000`) | Rails | Modern JSON:API endpoints (tournaments, players, identities, users) |
| `location /oauth/` | `rails_upstream` (`rails:3000`) | Rails | OAuth login (`/oauth/login`), logout (`/oauth/logout`), and callback |
| `location = /up` | `rails_upstream` (`rails:3000`) | Rails | Rails 8 built-in application healthcheck (`rails/health#show`) |
| `location = /api/classic/csrf_token` | `rails_upstream` (`rails:3000`) | Rails | CSRF token for the Svelte frontend's mutating requests. Without it, POST/PATCH/DELETE requests to Rails fail with 422. |
| `location /api/classic/tournaments/...` | `rails_upstream` (`rails:3000`) | Rails | Explicit literal routes for legacy JSON endpoints (`new_form`, `new_demo_form`, `create_demo`, `edit_form`, `standings_data`, `brackets`, `pairings_data`, `stages`). The config is spelled out to make cleanup easier as we migrate more pieces to the v1 JSON:API. |
| `location /beta/tournaments/...` | `rails_upstream` (`rails:3000`) | Rails | Explicit literal routes for active beta endpoints (timer, stats, registration, players, decks, rounds, pairings) |
| `location /_app/immutable/` | `node_upstream` (`svelte:3000`) | Svelte | Svelte compiled assets, with long cache. |
| `location /_app/` | `node_upstream` (`svelte:3000`) | Svelte | General SvelteKit client bundles and asset manifests |
| `location ~ ^/(favicon.*\|robots\.txt)$` | `node_upstream` (`svelte:3000`) | Svelte | Static favicon and crawler configuration |
| `location /` (catch-all) | `node_upstream` (`svelte:3000`) | Svelte | All UI routes (`/`, `/tournaments`, `/tournaments/*`, `/login`, `/profile`, `/help`, `/:slug`) |

---

## Directory Contents

| File | Purpose |
| :--- | :--- |
| [`Dockerfile.frontend`](file:///Users/jason/src/nsg/cobra/deploy/Dockerfile.frontend) | Multi-stage production build for the SvelteKit frontend using Node.js 24 Alpine and `@sveltejs/adapter-node`. |
| [`nginx.conf`](file:///Users/jason/src/nsg/cobra/deploy/nginx.conf) | Nginx reverse proxy configuration routing traffic between `rails_upstream` and `node_upstream`, with common proxy headers and buffer options embedded. It is an envsubst template: mount it at `/etc/nginx/templates/default.conf.template` and set `COBRA_RAILS_UPSTREAM` / `COBRA_SVELTE_UPSTREAM` (`rails:3000` / `svelte:3000` here). The devcontainer runs nginx alongside Rails and Vite and renders this file with `bin/dev-stack` (`127.0.0.1:3000` / `127.0.0.1:5173`). |
| [`docker-compose.yml`](file:///Users/jason/src/nsg/cobra/deploy/docker-compose.yml) | Standalone Compose stack running `gateway`, `svelte`, `rails`, and `db`. Exposes the gateway on port `3000`. |
| [`docker-compose.deploy.yml`](file:///Users/jason/src/nsg/cobra/deploy/docker-compose.deploy.yml) | Production deployment overlay configuring `null_signal` network integration, `VIRTUAL_HOST`, `LETSENCRYPT_HOST`, and logging. |

Environment variables that can be overridden:
- `COBRA_DOMAIN`: Hostname for `VIRTUAL_HOST` and `LETSENCRYPT_HOST` (e.g. `tournaments.nullsignal.games`).
- `LETSENCRYPT_EMAIL`: Contact email for Let's Encrypt certificates.
- `COBRA_SERVER_VERSION`: Tag for the Rails image.
- `FRONTEND_VERSION`: Tag for the SvelteKit frontend image.
