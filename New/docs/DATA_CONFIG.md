# 数据配置说明

本项目的本地后端数据集中配置在：

```text
server/mockData.js
```

修改后需要重启后端服务。如果是生产模式，还需要重新构建前端：

```bash
npm run build
npm start
```

## 货币规则

项目只允许两类货币字段：

- `coins`：金币，主货币。
- `eventCoins`：活动道具币，只用于活动、道具和兑换。

不要新增或命名为钻石、宝石、`diamond`、`gem`、`jewel` 等字段。

## 可配置模块

| 导出名 | 用途 | 前端位置 |
| --- | --- | --- |
| `user` | 玩家昵称、等级、VIP、经验 | 顶部栏、我的页面 |
| `wallet` | 金币、活动道具币、奖励余额 | 顶部栏、我的资产 |
| `jackpot` | 大奖池、触发规则、最近赢家 | 大厅奖池二级页 |
| `hero` | 大厅主 Banner | 大厅首屏 |
| `games` | Slot、休闲、捕鱼游戏列表和详情 | 大厅、游戏详情 |
| `tournaments` | 赛事列表、规则、人员、奖励 | 赛事页、赛事详情 |
| `events` | 活动列表、任务、里程碑、规则 | 活动页、活动详情 |
| `shop` | 金币包、道具、礼包 | 商城页、商城列表页 |
| `vip` | 会员成长值、等级、过期衰减、每日奖励 | 我的页、VIP 二级页 |
| `redeemCodes` | 商城兑换码和奖励 | 商城兑换区 |
| `dailyRewards` | 7 天每日奖励 | 大厅、每日奖励详情 |
| `wheel` | 转盘奖励和概率 | 幸运转盘 |
| `profile` | 钱包流水、礼物、消息、反馈、历史、成就、设置 | 我的页和二级页 |
| `leaderboard` | 赢家榜完整排名 | 大厅、排行榜二级页 |

## 游戏配置

示例：

```js
{
  id: 1024,
  name: '777 Deluxe',
  category: 'Slots',
  label: 'NEW',
  players: 1800,
  heat: 96,
  icon: 'https://games-web.coconut.tv/icon/777.png',
  url: '',
  rtp: '96.8%',
  volatility: 'High',
  minBet: 50,
  maxBet: 50000,
  tags: ['Slots', 'Jackpot', 'Free Spin'],
  features: ['Free spins', 'Wild reels', 'Progressive jackpot'],
  rules: ['Spin any line to score tournament points.']
}
```

配置要点：

- `category` 当前建议使用 `Slots` 或 `Casual`。
- 大厅默认显示热门，即按 `heat` 排序。
- `Fishing` 分类由名称、分类或 tags 中包含 fish/fishing/hunter 识别。
- `url` 是真实游戏 iframe 地址；为空时界面会提示等待服务器绑定。

## 赛事配置

赛事必须配置规则和人员情况：

```js
{
  id: 'mega-ways',
  title: 'MEGA WAYS TOURNAMENT',
  tag: 'MEGA',
  featured: true,
  status: 'ongoing',
  prizePool: 88888,
  players: 1228,
  capacity: 2000,
  endsIn: '02:45:16',
  rank: 12,
  rules: ['Eligible games: all Slot games.'],
  roster: {
    active: 1228,
    waiting: 212,
    eliminated: 84,
    staff: 12
  },
  allowedGames: ['777 Deluxe'],
  rewardTiers: [
    { rank: '1', reward: '30,000 Coins + 300 Event Coins' }
  ],
  schedule: {
    start: '2026-04-28 10:00',
    end: '2026-04-28 22:00',
    payout: 'Within 24h'
  }
}
```

配置要点：

- `featured: true` 会成为赛事页顶部主赛事。
- `status: 'ongoing'` 显示在进行中，`status: 'upcoming'` 显示在即将开始。
- 即将开始赛事需要配置 `startsIn`。
- `rules` 显示在赛事详情。
- `roster.active/waiting/eliminated/staff` 显示人员情况。
- `rewardTiers` 显示奖励档位。

## 活动配置

活动详情依赖 `missions`、`milestones`、`rules`：

```js
{
  id: 'summer-splash',
  type: 'LIMITED TIME',
  title: 'SUMMER SPLASH',
  progress: 12680,
  target: 25000,
  rank: 12,
  missions: [
    { id: 'slot-30', title: 'Play 30 Slot rounds', progress: 18, target: 30, points: 1200, reward: '2,000 Coins' }
  ],
  milestones: [
    { points: 3000, reward: 'Coins x1,000', claimed: true }
  ],
  leaderboard: [
    { name: 'NovaPlayer', points: 12680, current: true }
  ],
  rankRewards: [
    { rank: '1', reward: '50,000 Coins' }
  ],
  rules: ['Milestone rewards can be claimed once.']
}
```

配置要点：

- `featured: true` 会成为活动页顶部主活动。
- `progress / target` 控制进度条。
- `missions` 控制任务列表。
- `missions[].id` 是完成任务接口的稳定 ID。
- `missions[].points` 是完成任务后进入活动排行榜的积分。
- `milestones` 控制里程碑奖励。
- `leaderboard` 控制活动排行榜，当前用户可设置 `current: true`。
- `rankRewards` 控制活动结束后的排名奖励。
- 活动分类按钮使用 `type` 字段筛选：`LIMITED TIME`、`DAILY`、`WEEKLY`。

## 每日奖励配置

必须配置 7 天：

```js
{
  day: 'DAY 7',
  label: '10,000',
  amount: '10,000',
  coins: 10000,
  eventCoins: 20,
  premium: true
}
```

配置要点：

- 移动端大厅一行显示 7 天。
- `collected: true` 表示已领取。
- `premium: true` 会显示高亮。
- 补签接口是 `POST /api/daily-rewards/makeup`。

## 商城配置

商城分为三组：

- `shop.coins`：金币包。
- `shop.items`：活动道具币购买的道具。
- `shop.deals`：组合礼包。

商品详情使用字段：

- `title`
- `desc`
- `price` 或 `cost`
- `includes`
- `coins`
- `eventCoins`

移动端商城首页每组只展示 3 个，更多内容通过“查看全部”进入二级页。

兑换码配置：

```js
{
  code: 'VIPDAY',
  active: true,
  maxUses: 30,
  used: 0,
  reward: {
    coins: 5000,
    eventCoins: 50
  },
  desc: 'VIP day reward'
}
```

配置要点：

- 兑换码奖励只能使用 `coins` 和 `eventCoins`。
- 前端商城兑换区调用 `POST /api/redeem`。
- `used >= maxUses` 或 `active: false` 时接口会返回 `INVALID_REDEEM_CODE`。

## VIP 配置

```js
{
  active: true,
  currentLevel: 'GOLD',
  growth: 2680,
  nextGrowth: 5000,
  dailyGrowth: 120,
  decayPerDay: 80,
  expiresIn: '18d 04h',
  levels: [
    {
      level: 'GOLD',
      needGrowth: 2500,
      dailyReward: { coins: 3000, eventCoins: 20 },
      status: 'available',
      benefits: ['Daily coins', 'VIP tournament rooms']
    }
  ]
}
```

配置要点：

- 会员有效时每天增加 `dailyGrowth`。
- 会员到期后按 `decayPerDay` 衰减成长值。
- 等级奖励状态使用 `available`、`claimed`、`locked`。

## 我的页面配置

`profile` 下的数据会展示在二级页面：

- `transactions`：钱包流水。
- `gifts`：礼物。
- `messages`：消息。
- `support`：客服/反馈入口说明。
- `feedbacks`：用户提交的反馈记录。
- `settings`：设置项。声音已移除，语言切换在设置页。
- `history`：游戏记录。
- `achievements`：成就。

VIP 状态来自 `user.vip`，VIP 规则接口是：

```text
GET /api/profile/vip
```

## 修改数据后的验证

启动后端后可以检查：

```text
http://127.0.0.1:8787/api/lobby/bootstrap
http://127.0.0.1:8787/api/games/1024
http://127.0.0.1:8787/api/tournaments/mega-ways
http://127.0.0.1:8787/api/events/summer-splash
http://127.0.0.1:8787/api/shop/products/c3
http://127.0.0.1:8787/api/jackpot/slots
http://127.0.0.1:8787/api/daily-rewards
http://127.0.0.1:8787/api/profile/wallet
http://127.0.0.1:8787/api/profile/vip
```
