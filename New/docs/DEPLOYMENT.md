# Deployment Guide

This project can be deployed as one Node.js service. The service exposes APIs and serves the built frontend from `dist/`.

## Requirements

- Node.js 20.19 or newer
- npm 9 or newer

## Local Production Test

Windows one-click:

```powershell
.\一键启动.ps1 -Mode prod
```

Windows development one-click:

```powershell
.\一键启动.ps1
```

Windows real server account mode:

```powershell
.\一键启动.ps1 -Mode dev -DataMode real -ApiBaseUrl "https://你的真实服务器地址" -Uid "your-real-uid"
```

You can also double-click:

```text
一键启动.bat
```

Manual commands:

```bash
npm install
npm run build
npm start
```

Open:

```text
http://127.0.0.1:8787
```

Health check:

```text
http://127.0.0.1:8787/api/health
```

## Server Environment

```bash
PORT=8787
VITE_API_BASE_URL=http://127.0.0.1:8787
VITE_TEST_UID=LOCAL_TEST_UID
VITE_ROOM=
VITE_ROOM_TYPE=
VITE_IG=
```

Important:

- `VITE_*` variables are compiled at build time.
- If you change `VITE_API_BASE_URL`, run `npm run build` again.
- `PORT` is read at runtime by `server/index.js`.

## Suggested Process Manager

Use any standard Node process manager. Example with PM2:

```bash
npm run build
pm2 start server/index.js --name cocogames-lobby
```

## Reverse Proxy Example

Nginx example:

```nginx
server {
  listen 80;
  server_name games.example.com;

  location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Frontend And Backend Modes

Development mode:

```bash
npm run dev:server
npm run dev
```

- Vite serves the frontend.
- `vite.config.js` proxies `/api` to `http://127.0.0.1:8787`.
- The legacy HTTP client can target a real server through `VITE_API_BASE_URL`.

Production mode:

```bash
npm run build
npm start
```

- Node serves the frontend from `dist/`.
- Node serves all API and compatibility routes.

## Replacing Mock Data With Real Services

Current API data lives in:

```text
server/mockData.js
```

Current route handlers live in:

```text
server/index.js
```

Recommended migration path:

1. Keep the same endpoint paths and response field names from `docs/API.md`.
2. Replace read operations with database or upstream HTTP calls.
3. Replace write operations such as purchase, check-in, spin, and redeem with transactional service calls.
4. Keep mock fallback data for development and outage testing.
5. Add authentication middleware before exposing production payments or wallet changes.

## Reserved Integration Points

- Game iframe launch URL: `game.url`
- WebSocket token: `/ws/token`
- Legacy login metadata: `/game/lobby/login`
- Initial game list compatibility: `/game/lobby/InitReq`
- Shop purchase: `/api/shop/purchase`
- Event reward claim: `/api/events/:id/claim`
- Tournament join: `/api/tournaments/:id/join`

## Mobile And PC QA Checklist

- Test widths: 375px, 390px, 430px, 768px, 1024px, 1440px.
- Confirm bottom navigation does not cover critical buttons.
- Confirm game grid uses 2 columns on mobile and 4 columns on larger screens.
- Confirm tournament detail rules and participant cards wrap cleanly on mobile.
- Confirm shop grids remain horizontally readable on small devices.
- Confirm no blank screen appears if backend API is offline.

## Common Issues

Blank screen:

- Run `npm run build` to catch JSX or import errors.
- Check browser console for network errors.
- Confirm `/api/lobby/bootstrap` is reachable or fallback mode is shown.

API 503 on production start:

- `dist/` is missing. Run `npm run build` before `npm start`.

Wrong backend URL:

- Update `VITE_API_BASE_URL`.
- Rebuild the frontend.

Wallet naming conflict:

- Use `coins` and `eventCoins` only.
- Do not add diamond, gem, or jewel fields.
