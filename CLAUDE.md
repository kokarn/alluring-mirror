# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — local dev server with `node --watch` and `.env` loaded automatically (port 4000, override with `PORT`).
- `npm start` — production start (`node server.js`); the Dockerfile uses this.
- No tests, lint, or build step. `npm test` is a placeholder that exits non-zero.
- Docker: pushes to `master` trigger `.github/workflows/build-container.yml` which builds and pushes `ghcr.io/kokarn/alluring-mirror:latest`. `docker-compose.yml` is the deployment unit (volume `alluring-mirror-data` is mounted at `/usr/src/app/data`).

## Architecture

This is a smart-mirror dashboard: an Express server serves a static HTML page from `public/` plus a set of JSON proxy/aggregation endpoints under `/<name>/*` that the frontend polls.

**Route auto-mounting.** `server.js` iterates `routes/index.js` and mounts each entry as `app.use('/<key>/*', handler)`. To add a new endpoint, create `routes/<name>.js` exporting an Express handler `(req, res) => …` and register it in `routes/index.js`. The trailing `/*` means handlers receive a wildcard in `request.params['0']` (used by `images.js` to read cached filenames from the URL tail).

**Config-driven.** `data/config.json` is the runtime config — which weather location, which calendars, electricity region/markup, etc. Routes `require('../data/config.json')` directly at module load (so config changes need a restart to take effect for cached references; `config.js` writes via POST). `config.json` is exposed verbatim at `/config.json` and edited through the HTML form at `/config/`.

**Secrets.** API keys (OpenWeatherMap, Fanart.tv, Västtrafik, Coop, Portainer) come from environment variables, loaded from `.env` in dev via `--env-file`, and from `docker-compose.yml` env in prod. `.env` is gitignored.

**Frontend auto-reload.** `public/updater.js` polls `/checksum/` every 60s; `routes/checksum.js` returns a `dirsum` SHA1 of `public/`. When the hash changes the page hard-reloads — this is the deploy mechanism, no service worker. The page itself also has `<meta http-equiv="refresh" content="3600">` as a fallback.

**Image cache.** `routes/images.js` proxies show/movie artwork: tries `modules/apple-image` → `modules/github-image` → `modules/fanart-image`, streams the chosen URL into `data/image-cache/<query>.jpg`, and serves cached files on subsequent hits. The cache directory is created on boot in `server.js` and lives on the persistent Docker volume.

**External API clients** live in `modules/` (`apple-image`, `fanart-image`, `github-image`, `ical`, `portainer-client`) and are consumed by routes. HTTP uses `got` v9 (callback/promise style — note the older `{ json: true, query: {...} }` API, not v11+ options). Time handling uses `moment`.

**Frontend stack.** jQuery 3.6 from CDN plus a handful of vanilla IIFE scripts in `public/` (`clock.js`, `weather.js`, `commute.js`, `coop.js`, `services.js`, `blocks.js`). No build step — edits to `public/` are picked up by `dirsum` and trigger the auto-reload. Each script polls its own backend route on its own interval.
