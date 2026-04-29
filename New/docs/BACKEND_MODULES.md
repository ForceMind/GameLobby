# 后端模块结构与对接说明

本文档给后端程序员使用，说明 cocogames 游戏大厅每个业务模块的数据结构、接口、前端依赖字段和后续开发注意事项。

本地服务入口：

```text
server/index.js
```

本地模拟数据：

```text
server/mockData.js
```

本地默认地址：

```text
http://127.0.0.1:8787
```

如果 8787 已经被旧进程占用，可以临时指定端口：

```powershell
$env:PORT='8877'; npm start
```

## 通用响应规则

成功响应使用 JSON。部分接口为了兼容现有代码，会直接返回业务字段，例如：

```json
{
  "wallet": {
    "coins": 228680,
    "eventCoins": 420
  }
}
```

错误响应：

```json
{
  "code": "ERROR_CODE",
  "message": "Error message"
}
```

货币字段只能使用：

- `coins`：金币，主货币。
- `eventCoins`：活动道具币，用于活动、道具和兑换。

不要使用 `diamond`、`gem`、`jewel`、钻石、宝石等字段或文案。

## 1. 启动聚合模块 Lobby

接口：

```text
GET /api/lobby/bootstrap
```

用途：

- 前端首屏启动时读取全量数据。
- 真实服务拆分后，建议仍保留该聚合接口以减少首屏请求数量。

返回结构：

```json
{
  "user": {},
  "wallet": {},
  "jackpot": {},
  "hero": {},
  "games": [],
  "tournaments": [],
  "events": [],
  "shop": {},
  "vip": {},
  "profile": {},
  "dailyRewards": [],
  "wheel": {},
  "leaderboard": [],
  "redeemCodes": []
}
```

开发建议：

- 首屏接口必须快速返回。
- 子模块接口可以独立更新，但 bootstrap 字段不要删除。
- 列表字段返回空数组，不要返回 `null`。

## 2. 用户、钱包、我的页面

接口：

```text
GET /api/user/profile
GET /api/user/balance
GET /api/profile/:section
```

兼容接口：

```text
GET /user/profile
GET /user/balance
```

钱包结构：

```json
{
  "coins": 228680,
  "eventCoins": 420,
  "bonusBalance": 4680
}
```

用户结构：

```json
{
  "uid": "98271631",
  "nickname": "NovaPlayer",
  "avatar": "",
  "level": 28,
  "xp": 12650,
  "nextXp": 20000,
  "vip": "GOLD"
}
```

`/api/profile/:section` 支持：

- `wallet`：钱包流水。
- `assets`：资产明细。
- `bonus`：券奖励余额来源。
- `gifts`：我的礼物。
- `messages`：消息。
- `support`：客服反馈系统，包含标题、内容、状态和提交时间。
- `history`：游戏记录完整二级页。
- `achievements`：成就完整二级页。
- `settings`：设置页，语言切换在前端本地保存，也可以后续由后端返回支持语言。
- `vip`：VIP 状态、规则和权益。

开发建议：

- 钱包变动必须由服务端事务控制。
- 前端购买、领奖只是演示，生产必须二次校验。
- `bonusBalance` 如不可提现，需要后端明确标记类型和使用规则。
- 资产明细页读取 `profile.transactions`，生产环境应由钱包账本服务分页返回。
- 客服反馈提交接口是 `POST /api/profile/feedback`，生产环境需要接入工单状态、客服回复、用户追问。

### VIP 会员

接口：

```text
GET /api/profile/vip
POST /api/profile/vip/reward
```

VIP 结构：

```json
{
  "active": true,
  "currentLevel": "GOLD",
  "growth": 2680,
  "nextGrowth": 5000,
  "dailyGrowth": 120,
  "decayPerDay": 80,
  "expiresIn": "18d 04h",
  "levels": [
    {
      "level": "GOLD",
      "needGrowth": 2500,
      "dailyReward": {
        "coins": 3000,
        "eventCoins": 20
      },
      "status": "available"
    }
  ]
}
```

规则：

- 会员有效时每天增加 `dailyGrowth`。
- 会员过期后每天按 `decayPerDay` 衰减成长值。
- 不同等级可以领取不同奖励，状态使用 `available`、`claimed`、`locked`。

## 3. 游戏模块

接口：

```text
GET /api/games
GET /api/games/:id
GET /api/jackpot/slots
```

兼容接口：

```text
GET /game/list
GET /game/:id
```

游戏结构：

```json
{
  "id": 1024,
  "name": "777 Deluxe",
  "category": "Slots",
  "label": "NEW",
  "players": 1800,
  "heat": 96,
  "icon": "https://games-web.coconut.tv/icon/777.png",
  "url": "",
  "rtp": "96.8%",
  "volatility": "High",
  "minBet": 50,
  "maxBet": 50000,
  "tags": ["Slots", "Jackpot"],
  "features": ["Free spins"],
  "rules": ["Spin any line to score tournament points."]
}
```

前端分类：

- 默认显示 `热门`，按 `heat` 排序。
- 其他分类是 `Slot`、`休闲`、`捕鱼`。
- `捕鱼` 当前通过名称、分类和 tags 中的 fish/fishing/hunter 识别。

开发建议：

- `category` 当前建议使用 `Slots` 或 `Casual`。
- `url` 是真实游戏 iframe 地址，接入后填写完整启动地址。
- 启动地址如果需要 token，后端应返回一次性签名 URL。

## 4. 奖池模块

接口：

```text
GET /api/jackpot
GET /api/jackpot/slots
```

数据结构：

```json
{
  "total": 88888,
  "seed": 50000,
  "trigger": "Any Slot jackpot symbol combination",
  "latestWinners": [
    { "name": "ReelMaster", "amount": 128800, "game": "777 Deluxe" }
  ]
}
```

开发建议：

- 大厅奖池点击后进入二级页，展示可触发大奖的 Slot 游戏。
- `latestWinners` 用于最近获奖列表。
- 所有金额仍然是 `coins`，不是美元。

## 5. 赛事模块

接口：

```text
GET /api/tournaments
GET /api/tournaments/:id
POST /api/tournaments/:id/join
GET /arena/:id/leaderboard
```

兼容接口：

```text
GET /arena/list
POST /arena/:id/join
```

赛事结构：

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
  "rules": [],
  "roster": {
    "active": 1228,
    "waiting": 212,
    "eliminated": 84,
    "staff": 12
  },
  "allowedGames": [],
  "rewardTiers": [],
  "schedule": {}
}
```

开发建议：

- `status` 使用 `ongoing` 或 `upcoming`，即将开始赛事显示 `startsIn`。
- 报名接口必须校验资格、余额、地区限制和活动时间。
- 排名需要稳定排序规则，例如分数相同按首次达成时间排序。
- 奖励发放要有审计状态：`pending`、`approved`、`paid`、`rejected`。

## 6. 活动、任务、签到

接口：

```text
GET /api/events
GET /api/events/:id
POST /api/events/:id/claim
POST /api/events/:id/missions/:missionId/complete
GET /api/events/:id/ranking
GET /api/daily-rewards
POST /api/daily-rewards/makeup
POST /api/checkin
GET /api/wheel
POST /api/wheel/spin
```

兼容接口：

```text
GET /activity/list
GET /activity/tasks
POST /activity/task/claim
POST /activity/checkin
POST /activity/wheel/spin
```

活动结构：

```json
{
  "id": "summer-splash",
  "type": "LIMITED TIME",
  "title": "SUMMER SPLASH",
  "progress": 12680,
  "target": 25000,
  "rank": 12,
  "missions": [],
  "milestones": [],
  "leaderboard": [],
  "rankRewards": [],
  "rules": []
}
```

活动业务流程：

- 用户完成活动任务，后端根据任务配置增加任务进度。
- 任务完成或阶段推进后，后端增加 `event.progress` 活动积分。
- 活动积分进入 `event.leaderboard`，当前用户用 `current: true` 标记。
- 活动结束时按照 `rankRewards` 结算奖励。
- 前端不再把活动当作普通领奖列表，而是展示“任务 -> 积分 -> 排名 -> 结算”的流程。

每日奖励要求：

- `dailyRewards` 必须返回 7 天数据。
- 移动端大厅一行显示 7 天。
- 查看全部进入二级页，展示规则和补签。
- 补签接口 `POST /api/daily-rewards/makeup` 当前接收 `{ "cost": 1000 }`。

开发建议：

- 任务进度应由游戏服务或消息队列驱动，不要信任前端上报。
- 领奖接口必须幂等，同一奖励只能领取一次。
- 转盘概率必须由服务端控制，前端只展示概率和结果。

## 7. 商城模块

接口：

```text
GET /api/shop/products
GET /api/shop/products/:id
POST /api/shop/purchase
POST /api/redeem
```

兼容接口：

```text
GET /store/products
POST /store/purchase
POST /store/redeem
```

商城数据分组：

- `shop.coins`：金币包。
- `shop.items`：活动道具币购买的道具。
- `shop.deals`：组合礼包。
- `redeemCodes`：兑换码配置，包含 `code`、`active`、`maxUses`、`used`、`reward`。

移动端规则：

- 商城首页每组显示 3 个卡片。
- 点击“查看全部”进入对应二级页。
- 顶部 `精选/金币/道具/礼包/VIP/兑换` 需要滚动到对应区域。
- 兑换码在商城兑换区输入，调用 `POST /api/redeem`，奖励只能是 `coins` 和 `eventCoins`。

## 8. 排行榜模块

接口：

```text
GET /api/leaderboard
GET /leaderboard/winners
GET /arena/:id/leaderboard
```

结构：

```json
[
  { "name": "ReelMaster", "score": 128800 }
]
```

开发建议：

- 大厅只展示前 4 名。
- 点击查看全部进入完整排行榜二级页。
- 赛事排行榜建议按赛事 ID 单独返回。

## 9. 后台管理

入口：

```text
/?admin=1
```

接口：

```text
GET /api/admin/snapshot
GET /api/admin/collections/:name
PUT /api/admin/collections/:name
POST /api/admin/reset
```

说明：

- 当前后台用于本地 mock 数据调试。
- 后台已经能管理 `games`、`tournaments`、`events`、`shop`、`vip`、`profile`、`redeemCodes` 等运营集合。
- `PUT /api/admin/collections/:name` 只保存到当前服务内存。
- 如果要永久修改默认数据，需要同步改 `server/mockData.js`。
- 生产后台还需要补权限、审计日志、发布流程和数据校验，目前本项目保留的是可部署 mock 运营后台。

## 后端验收建议

启动服务后检查：

```text
http://127.0.0.1:8787/api/lobby/bootstrap
http://127.0.0.1:8787/api/jackpot/slots
http://127.0.0.1:8787/api/daily-rewards
http://127.0.0.1:8787/api/profile/vip
http://127.0.0.1:8787/api/events/summer-splash/ranking
http://127.0.0.1:8787/api/profile/history
http://127.0.0.1:8787/api/profile/achievements
```
