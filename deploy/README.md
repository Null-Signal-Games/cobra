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
| [`.env.example`](.env.example) | Template for `deploy/.env`, which fills in every `${...}` value in both Compose files. |
| [`rails.env.example`](rails.env.example) | Template for `deploy/rails.env`, the Rails-only secrets loaded into the `rails` container. |

## Configuration

Each value has exactly one home, and Compose refuses to start if a required one is missing (`${VAR:?}`); nothing falls back to a default.

### Env files

Every env file the repo uses has a committed `*.example` next to it. The real files are gitignored and kept out of image builds; create each one by copying its example.

| File | Example | Needed for | Read by | Holds |
| :--- | :--- | :--- | :--- | :--- |
| `deploy/.env` | [`deploy/.env.example`](.env.example) | This stack | Compose itself, to fill in `${...}` in `docker-compose.yml` and `docker-compose.deploy.yml` | Settings shared across services, listed below |
| `deploy/rails.env` | [`deploy/rails.env.example`](rails.env.example) | This stack | The `rails` container only (`env_file`) | `SECRET_KEY_BASE`, `NRDB_CLIENT`, `NRDB_SECRET`, `ABRAUTH`, `RAILS_LOG_LEVEL` |
| `frontend/.env` | [`frontend/.env.example`](../frontend/.env.example) | Local development | Vite (`bin/dev-stack` or `npm run dev`); deployed containers ignore it | `CLIENT_COBRA_API_ENDPOINT` |
| `.env` (repo root) | [`.env.example`](../.env.example) | The classic top-level stack only | The classic `docker-compose.yml`, both to fill in `${...}` and as `env_file` for `app` and `db` | `POSTGRES_PASSWORD`, `RAILS_ENV`, and the Rails secrets in production |

For this stack:

```bash
cp deploy/.env.example deploy/.env
cp deploy/rails.env.example deploy/rails.env
```

The devcontainer creates `frontend/.env` from its example automatically. For the classic stack, run `cp .env.example .env` in the repo root.

Compose reads `.env` from the project directory, which is the folder of the first `-f` file (`deploy/`), not the folder you run the command from. The repo-root `.env` is only for the classic top-level stack. Values exported in your shell still override `deploy/.env`.

### `deploy/.env` settings
- `FRONTEND_VERSION` / `COBRA_SERVER_VERSION`: Tags for the SvelteKit and Rails images.
- `COBRA_DOMAIN`: Public hostname. Used for `VIRTUAL_HOST` and `LETSENCRYPT_HOST`, and passed to Rails for the NRDB OAuth `redirect_uri`.
- `COBRA_ORIGIN`: Public URL of the site (e.g. `https://tournaments.nullsignal.games`), passed to the SvelteKit server as `ORIGIN`. adapter-node builds server-side URLs (`event.url`, `page.url`) from it rather than the request's Host header.
- `LETSENCRYPT_EMAIL`: Contact email for Let's Encrypt certificates.
- `RAILS_ENV`: Rails environment (`production` on deployed hosts).
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`: Database credentials, shared by the `db` and `rails` containers.

## Local development

The devcontainer does not use these Compose files. `bin/dev-stack` runs nginx (rendering `nginx.conf`), Rails and Vite inside the container. Vite reads `frontend/.env`, which is created from `frontend/.env.example` when the container is created. `bin/dev-stack` also sets `SERVER_COBRA_API_ENDPOINT=http://127.0.0.1`, so server-side requests go through nginx the same way production's go through `http://gateway`.
