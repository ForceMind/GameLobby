# cocogames API Contract

Base URL in local development:

```text
http://127.0.0.1:8787
```

The backend is intentionally mock-compatible. It can receive current frontend requests, serve missing data, and reserve stable endpoints for future real services.

## Response Style

Successful responses use JSON objects. Errors use:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message"
}
```

## Currency Fields

Use only these currency fields:

- `coins`: main gold coin balance.
- `eventCoins`: activity/event coin balance used for event items.

Do not use diamond, gem, jewel, or similar naming in APIs.

## Main Data Shape

`GET /api/lobby/bootstrap` returns:

```json
{
  "user": {
    "uid": "98271631",
    "nickname": "NovaPlayer",
    "avatar": "",
    "level": 28,
    "xp": 12650,
    "nextXp": 20000,
    "vip": "GOLD"
  },
  "wallet": {
    "coins": 228680,
    "eventCoins": 420,
    "bonusBalance": 4680
  },
  "jackpot": {
    "total": 88888
  },
  "games": [],
  "tournaments": [],
  "events": [],
  "shop": {},
  "vip": {},
  "profile": {},
  "dailyRewards": [],
  "leaderboard": [],
  "redeemCodes": []
}
```

## Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/lobby/bootstrap` | Full lobby bootstrap payload |
| GET | `/api/config` | Data configuration metadata |
| GET | `/api/user/profile` | Current user profile |
| GET | `/api/user/balance` | Current wallet balance |
| GET | `/api/games` | Game list |
| GET | `/api/games/:id` | Game detail |
| GET | `/api/tournaments` | Tournament list |
| GET | `/api/tournaments/:id` | Tournament detail |
| POST | `/api/tournaments/:id/join` | Join tournament |
| GET | `/api/events` | Event and task list |
| GET | `/api/events/:id` | Event detail |
| POST | `/api/events/:id/claim` | Claim event reward |
| POST | `/api/events/:id/missions/:missionId/complete` | Complete one event mission step and add event points |
| GET | `/api/events/:id/ranking` | Event leaderboard and rank rewards |
| GET | `/api/shop/products` | Shop product list |
| GET | `/api/shop/products/:id` | Shop product detail |
| POST | `/api/shop/purchase` | Purchase product |
| GET | `/api/leaderboard` | Winner board |
| GET | `/api/jackpot` | Jackpot summary |
| GET | `/api/jackpot/slots` | Slot games eligible for jackpot entry |
| GET | `/api/daily-rewards` | Daily reward chain |
| POST | `/api/daily-rewards/makeup` | Paid make-up check-in |
| GET | `/api/wheel` | Lucky wheel reward config |
| GET | `/api/profile/:section` | Profile secondary page data |
| POST | `/api/profile/feedback` | Submit support feedback |
| GET | `/api/profile/vip` | VIP growth, levels, rules |
| POST | `/api/profile/vip/reward` | Claim VIP level reward |
| POST | `/api/checkin` | Daily check-in |
| POST | `/api/wheel/spin` | Lucky wheel spin |
| POST | `/api/redeem` | Redeem code |

## Game Fields

```json
{
  "id": 1024,
  "name": "777 Deluxe",
  "category": "Slots",
  "label": "NEW",
  "players": 1800,
  "heat": 96,
  "icon": "https://games-web.coconut.tv/icon/777.png",
  "url": ""
}
```

Notes:

- `category` should be `Slots` or `Casual` for current UI filters.
- `url` is reserved for an iframe game entry URL. Empty means the game is visible but not yet bound.

## Tournament Fields

```json
{
  "id": "mega-ways",
  "title": "MEGA WAYS TOURNAMENT",
  "tag": "MEGA",
  "featured": true,
  "status": "ongoing",
  "prizePool": 88888,
  "players": 1228,
  "capacity": 2000,
  "endsIn": "02:45:16",
  "rank": 12,
  "image": "https://games-web.coconut.tv/icon/slots.png",
  "rules": [
    "Play any slot to earn points",
    "1 point per 100 net coins won",
    "Top 100 receive rewards"
  ],
  "roster": {
    "active": 1228,
    "waiting": 212,
    "eliminated": 84,
    "staff": 12
  }
}
```

Required detail fields:

- `status`: `ongoing` or `upcoming`. Upcoming tournaments use `startsIn`.
- `rules`: ordered rule list displayed in the tournament detail panel.
- `roster.active`: players currently participating.
- `roster.waiting`: waiting list count.
- `roster.eliminated`: eliminated or inactive participant count.
- `roster.staff`: official/admin count.

## Event Missions And Ranking

Events are ranked by event points. The frontend flow is:

1. User completes event missions.
2. Server increases `event.progress`.
3. Server updates `event.leaderboard`.
4. Rewards are settled from `rankRewards`.

`POST /api/events/:id/missions/:missionId/complete` response:

```json
{
  "completed": false,
  "pointGain": 120,
  "event": {},
  "leaderboard": []
}
```

Event fields:

- `missions[].id`: stable mission id for completion.
- `missions[].points`: points granted when completed.
- `rank`: current user event rank.
- `leaderboard`: event ranking list.
- `rankRewards`: final settlement reward tiers.

## Profile Sections

`GET /api/profile/:section` is used by all Me secondary pages.

Supported sections:

- `wallet`: wallet overview and transactions.
- `assets`: wallet balances and asset snapshot.
- `bonus`: ticket bonus balance and sources.
- `gifts`: gift list.
- `messages`: message list.
- `support`: feedback form metadata and submitted feedback list.
- `history`: full game history page.
- `achievements`: full achievements page.
- `settings`: settings page. Language switching is local UI state; backend can return available locales later.
- `vip`: VIP status, rules, and benefits.

VIP response example:

```json
{
  "vip": {
    "active": true,
    "currentLevel": "GOLD",
    "growth": 2680,
    "nextGrowth": 5000,
    "dailyGrowth": 120,
    "decayPerDay": 80,
    "levels": []
  }
}
```

`POST /api/profile/feedback` request:

```json
{
  "title": "Mobile layout issue",
  "content": "Describe the issue"
}
```

`POST /api/profile/vip/reward` request:

```json
{
  "level": "GOLD"
}
```

## Daily Rewards

`GET /api/daily-rewards` must return a seven-day chain. Mobile UI renders all 7 days in one row.

`POST /api/daily-rewards/makeup` request:

```json
{
  "cost": 1000
}
```

Response:

```json
{
  "madeUp": true,
  "cost": 1000,
  "reward": {
    "day": "DAY 2",
    "coins": 1000
  },
  "wallet": {
    "coins": 227680,
    "eventCoins": 420,
    "bonusBalance": 4680
  }
}
```

## Jackpot

`GET /api/jackpot` returns total, seed, trigger, and latest winners.

`GET /api/jackpot/slots` returns Slot games that can trigger the jackpot. The frontend opens this from the Lobby jackpot card.

## Shop Purchase

Request:

```json
{
  "productId": "c3"
}
```

## Redeem Code

`POST /api/redeem` request:

```json
{
  "code": "VIPDAY"
}
```

Response:

```json
{
  "redeemed": true,
  "reward": {
    "coins": 5000,
    "eventCoins": 50
  },
  "wallet": {}
}
```

Redeem codes are configured in `server/mockData.js` export `redeemCodes`.

Response:

```json
{
  "purchased": true,
  "product": {
    "id": "c3",
    "coins": 200000,
    "bonus": "+30%",
    "price": "$9.99",
    "best": true
  },
  "wallet": {
    "coins": 428680,
    "eventCoins": 420,
    "bonusBalance": 4680
  }
}
```

## Compatibility Routes

These routes are kept for existing client code:

| Legacy Path | New Equivalent |
| --- | --- |
| `/game/lobby/login` | Login/bootstrap metadata |
| `/game/lobby/InitReq` | Initial user and game list |
| `/game/list` | `/api/games` |
| `/game/:id` | `/api/games/:id` |
| `/user/profile` | `/api/user/profile` |
| `/user/balance` | `/api/user/balance` |
| `/arena/list` | `/api/tournaments` |
| `/arena/:id/join` | `/api/tournaments/:id/join` |
| `/arena/:id/leaderboard` | `/api/leaderboard` |
| `/activity/list` | `/api/events` |
| `/activity/tasks` | `/api/events` |
| `/activity/task/claim` | `/api/events/:id/claim` style behavior |
| `/activity/checkin` | `/api/checkin` |
| `/activity/wheel/spin` | `/api/wheel/spin` |
| `/store/products` | `/api/shop/products` |
| `/store/purchase` | `/api/shop/purchase` |
| `/store/redeem` | `/api/redeem` |
| `/leaderboard/winners` | `/api/leaderboard` |
| `/ws/token` | Reserved WebSocket auth endpoint |

## Integration Rules For Future Backend Work

- Keep existing field names stable. Add new fields without removing old fields.
- Keep `coins` and `eventCoins` numeric.
- Return empty arrays instead of null for list fields.
- Return empty strings for not-yet-bound game URLs.
- Tournament detail must include `rules` and `roster`.
- API errors should return HTTP 4xx or 5xx plus the standard error JSON shape.
