# Frontend Server Client Notes

This folder contains the existing frontend integration layer:

- `httpClient.js`: legacy HTTP client for `/game/*`, `/user/*`, `/arena/*`, `/activity/*`, `/store/*`, and `/leaderboard/*`.
- `socketClient.js`: WebSocket client and event dispatcher.
- `player.js`: local player store used by the lobby UI.
- `index.js`: unified exports used by React screens.

The new local backend lives in:

```text
server/index.js
```

API documentation lives in:

```text
docs/API.md
```

The frontend first requests `/api/lobby/bootstrap`. If that fails, it can still fall back to mock UI data and keep the page visible instead of showing a blank screen.
