# VPS API deployment notes

## 1) Create API service

- Copy `deploy/vps/chatterly-api.service.example` to `/etc/systemd/system/chatterly-api.service`.
- Update `User`, `WorkingDirectory`, and Bun path if needed.
- Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable chatterly-api
sudo systemctl restart chatterly-api
sudo systemctl status chatterly-api
```

## 2) Configure reverse proxy

- Copy `deploy/vps/nginx-api.conf.example` to `/etc/nginx/sites-available/chatterly-api`.
- Set `server_name` to your API domain.
- Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/chatterly-api /etc/nginx/sites-enabled/chatterly-api
sudo nginx -t
sudo systemctl reload nginx
```

## 3) Enable TLS

Use Certbot (or Caddy automatic TLS) so API is available at `https://api.yourdomain.com`.

## 4) Required API env vars

At minimum set these in `/srv/chatterly-v2/apps/api/.env`:

- `NODE_ENV=production`
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_AUTHORIZED_PARTIES` (comma-separated, include web domain)
- `ALLOWED_ORIGINS` (comma-separated, include web domain)
- `JWT_SECRET` (non-default secure value)
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (optional, defaults to `deepseek/deepseek-chat`)
