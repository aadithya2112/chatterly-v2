# Deployment and CI/CD overview

## Targets

- `apps/web` -> Vercel
- `apps/api` -> VPS (Bun + systemd + Nginx/Caddy)
- `apps/widget/dist/widget.js` -> GitHub Pages static hosting

## GitHub workflows

- `.github/workflows/ci.yml`
  - Runs API tests and validates API/widget build.
- `.github/workflows/deploy-web-vercel.yml`
  - Deploys `apps/web` to Vercel on push to `main`.
- `.github/workflows/deploy-api-vps.yml`
  - SSH deploys and restarts API service on VPS.
- `.github/workflows/deploy-widget-pages.yml`
  - Publishes `apps/widget/dist` to GitHub Pages.

## Required GitHub secrets

### Vercel web deploy

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### VPS API deploy

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT` (optional, defaults to 22)

## Required runtime env vars

### `apps/web` (Vercel)

- `NEXT_PUBLIC_API_URL` (e.g. `https://api.example.com/api`)
- `NEXT_PUBLIC_WIDGET_SCRIPT_URL` (e.g. `https://<user>.github.io/<repo>/widget.js`)
- Clerk web env vars

### `apps/api` (VPS)

- `NODE_ENV=production`
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_AUTHORIZED_PARTIES` (include Vercel domain)
- `ALLOWED_ORIGINS` (include Vercel domain)
- `JWT_SECRET` (secure, non-default)
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (optional)

See `deploy/vps/README.md` for service + proxy setup.
