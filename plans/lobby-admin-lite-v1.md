# Game Lobby & Admin Lite v1 开发计划

> 分支：`lobby-admin-lite-v1`（不使用任何额外前缀）  
> 文档状态：已确认范围，待按阶段实现  
> 目标：把现有高保真演示收敛为可继续接入生产服务的大厅与运营后台 Lite v1。

## 1. 范围与完成定义

Lite v1 面向玩家和运营人员，必须具备完整的生产级交互原型：文案、规则、确认、异步状态、空数据、失败、重试、过期、权限和审计都要有明确表现。原型可以在服务未接入时使用明确标记的本地适配器，但不得把模拟奖励、模拟支付或前端随机结果当作生产成功。

前台只保留五个主导航：大厅、游戏、活动、商城、我的。功能范围为：

- 游戏列表、推荐游戏、游戏启动状态；
- 活动转盘、七日签到、每日任务、奖励记录；
- 商城金币礼包、月度特权卡、明日宝箱（原“破产保险箱”的产品包装）；
- 我的页面：资料、资产、权益、订单、钱包流水、奖励记录、帮助。

明确不做：赛事及报名/结算、直播房间、家族/派对活动、复杂社交活动、语言/声音/震动设置、兑换码和复杂促销体系。移除入口、路由、菜单、CTA 和死链，不保留“暂未开放”的赛事占位页。

完成定义：前后台页面可以按本文档逐条验收；前台展示字段均有静态 JSON 或服务端来源；所有写操作有处理中、成功、失败/重试和幂等语义；运营配置有版本、审核、发布、暂停和审计；构建和代表性尺寸视觉检查通过。

## 2. 已有实现与待接入边界

### 已实现（现状，不能当作生产能力）

- React + Vite 多页面入口，现有大厅、游戏、活动、商城、我的和后台外壳。
- `client/src/locales/` 中已有中英文消息目录，`client/src/i18n.js` 已有 `zh` / `en` locale 解析和插值能力。
- `client/src/data.js` 有游戏、导航、活动等静态演示数据；其中仍包含赛事、直播和“演示/未真实到账”等旧内容。
- 页面可展示部分加载、空态、维护和弹窗样式，但覆盖不完整。

### 待实现/待接入（本版本交付要求）

- 将 Lite v1 的基础展示内容从 JS 常量迁移为可校验的 JSON；动态余额、在线人数、活动进度、奖励、商品状态、订单和流水不得继续由页面常量冒充。
- 用服务端开奖、结算、扣款和发奖结果驱动转盘、明日宝箱、月卡和订单；宿主未接入时只显示“原型预览/服务未连接”，不得伪造到账。
- 清理赛事、直播和社交功能的前后台入口及无关数据消费。
- 将旧的“以中文显示文案作为 key、英文反查”的兼容层逐步替换为稳定命名 key；保留迁移期兼容，但新代码不得新增中文源文案 key。

## 3. 信息架构与生产级页面契约

### 3.1 大厅与游戏

大厅包含账户摘要、单一主 Banner、最近玩过、热门游戏和权益提醒。游戏列表支持全部/Slots/休闲/实时筛选。游戏卡片字段为 `id`、本地化名称 key、分类 key、封面资源、标签 key、在线人数、热度、可用地区、状态和排序。

游戏状态至少包括 `ready`、`maintenance`、`upcoming`、`region_unavailable`、`loading`、`launch_failed`。维护/地区不可用不可启动；启动流程必须显示加载、重复点击锁定、成功跳转和失败重试。在线人数无数据时显示“暂无数据”，不得使用静态数字冒充实时数据。

### 3.2 活动

活动页固定展示七日签到、幸运转盘、每日任务和奖励记录入口。所有活动具有 `draft`、`testing`、`pending_review`、`published`、`paused`、`ended`、`archived` 状态；前台只消费当前已发布版本。

签到：7 日奖励由后台配置，每日按服务端业务时区刷新；领取接口幂等，已领取不可重复发奖，缺席补签规则在 v1 明确为“不支持”。

转盘：每日免费次数由服务端返回；概率和奖项由已发布版本决定，结果由服务端产生并记录，不由浏览器随机。中断后必须通过奖励记录查询最终结果。

任务：任务定义包含事件类型、目标、进度、奖励、有效期和领取状态。v1 默认任务为完成 3 局游戏、完成 5 局游戏、登录并领取签到；具体数量可由后台版本配置。

### 3.3 商城与权益

金币礼包仅保留首版必要 SKU；订单状态为 `pending_payment`、`processing`、`paid`、`failed`、`refund_pending`、`refunded`、`exception`。未接入宿主支付时只能进入确认预览，不显示支付成功。

月度特权卡默认 30 个自然日、每日主动领取 2,000 金币 + 1 宝石、不自动续费、当日未领取不补发。服务端返回生效时间、到期时间、当日领取状态和累计领取天数。

明日宝箱已改为单个次日宝箱：今天完成有效游戏后可购买，500 金币/个，每日限购一次，次日开启；不再月度激活。前台仅展示购买资格、可能奖励上限、开启/截止时间和结果，内部计算依据不向玩家返回。完整数据/状态/接口与恢复的赢家榜、最近中奖、弹幕见 [新契约](tomorrow-chest-and-winners.md)。

### 3.4 我的

展示资料、玩家 ID、等级、金币/宝石余额、月卡和明日宝箱权益、订单、奖励记录、钱包流水、帮助与客服。不得出现语言、声音、震动设置。locale 不属于玩家可编辑资料，按宿主/URL/默认值解析；如未来需要切换语言，应在独立产品能力中实现，不在 Lite v1 增加设置入口。

## 4. 静态 JSON 与动态服务端边界

### 4.1 静态基础内容

适合发布随版本变更、无需玩家实时一致性的内容使用 JSON 导入前端：页面文案 key 映射、导航定义、游戏基础元数据/封面资源、活动说明、商品营销文案、帮助文章和默认展示排序。建议目录：

```text
client/src/data/
  lite-v1-content.schema.json   # 字段约束与来源边界
  lite-v1-content.example.json  # 可运行的脱敏示例，不是生产数据
```

JSON 只保存稳定 ID、locale key、资源路径和展示规则，不保存玩家余额、概率结果、订单结果、领取结果、实时人数或可被后台修改的当前状态。客户端加载失败时显示明确的内容加载错误和重试，不回退到隐式硬编码副本。

### 4.2 动态服务端内容

服务端必须提供玩家身份、余额、实时游戏可用性/人数、活动当前版本和进度、转盘次数与结果、签到领取、任务领取、商品可售状态、订单、月卡状态、宝箱结算和奖励/钱包流水。后台所有列表和配置读写也必须使用 API；前端本地适配器只用于开发联调，响应结构必须与 API 一致并加 `source: "mock"` 标记。

## 5. 多语言结构（不增加语言设置）

所有用户可见文本、后台字段、错误、状态、帮助、规则和营销文案必须有稳定 key；中文和英文都必须在提交前通过完整性校验。新 key 按领域命名，例如：

```text
nav.lobby
game.status.maintenance
activity.checkin.claim
activity.wheel.remaining
mission.progress
product.monthly_pass.daily_reward
product.loss_recovery_chest.pending_settlement
order.status.processing
error.network.retry
admin.game.publish
```

推荐资源结构：

```js
// client/src/locales/zh.js / en.js（目标结构）
export default {
  nav: { lobby: '大厅', games: '游戏', activities: '活动', store: '商城', profile: '我的' },
  activity: { checkin: { claim: '领取今日奖励' } },
}
```

动态数据只返回 `*_key` 和插值参数（如 `title_key`、`status_key`、`amount`、`currency`），不返回依赖当前语言的 HTML。日期、数字、货币由客户端按 locale 格式化；富文本只允许受控 token，不直接渲染服务端 HTML。接口响应可附带 `display_name` 作为降级，但不能替代 locale key。

locale 解析优先级为 URL/宿主上下文、已存在的运行时值、默认 `zh`；本版本不提供设置页或个人资料中的语言切换。缺失翻译在开发环境报错并显示 key，在生产环境按约定回退英文/中文，同时上报缺失 key。

## 6. 数据模型与接口契约

核心实体：`Player`、`Game`、`GameVersion`、`Activity`、`ActivityVersion`、`CheckinReward`、`WheelPrize`、`DailyMission`、`Product`、`PlayerEntitlement`、`ChestSettlement`、`RewardClaim`、`Order`、`WalletLedger`、`AuditLog`。

前台最小 API：

```text
GET  /api/v1/games
POST /api/v1/games/{id}/launch
GET  /api/v1/activities
POST /api/v1/checkin/claim
POST /api/v1/wheel/spin
GET  /api/v1/missions
POST /api/v1/missions/{id}/claim
GET  /api/v1/rewards/history
GET  /api/v1/products
POST /api/v1/orders
GET  /api/v1/orders/{id}
GET  /api/v1/chest/status
POST /api/v1/chest/purchases
POST /api/v1/chest/open
GET  /api/v1/winners/today
GET  /api/v1/monthly-pass/status
POST /api/v1/monthly-pass/claim
GET  /api/v1/profile
GET  /api/v1/wallet/ledger
```

后台最小 API：

```text
GET/POST/PATCH /admin/api/v1/games[/{id}]
POST /admin/api/v1/games/{id}/publish
GET/POST/PATCH /admin/api/v1/activities[/{id}]
POST /admin/api/v1/activities/{id}/submit-review
POST /admin/api/v1/activities/{id}/publish
GET/POST/PATCH /admin/api/v1/products[/{id}]
GET /admin/api/v1/orders
GET /admin/api/v1/wallet-ledger
GET /admin/api/v1/players[/{id}]
GET /admin/api/v1/audit-logs
```

写请求携带 `request_id`、`idempotency_key`、操作者身份和资源 `version`；响应统一包含 `data`、`request_id`、`server_time`、`locale`（仅描述响应语言，不提供设置能力）和可操作错误码。资产变更必须原子写入钱包流水，奖励领取必须与幂等键绑定；已发布配置不可覆盖，只能生成新版本并支持回滚。

## 7. 后台模块与权限

后台保留运营概览、游戏运营、活动中心、商城与权益、订单与钱包、玩家管理、发布中心、操作日志。游戏、活动和商品配置支持草稿/审核/发布/暂停/归档；转盘概率总和必须为 100%，返还比例和上限必须通过业务校验。发布、暂停、回滚、人工处理异常订单等动作需要相应角色权限并写入前后值、操作者、时间、结果和失败原因。

## 8. 分阶段执行目标

### P0：分支与范围基线

创建 `lobby-admin-lite-v1`；清理赛事/直播/社交入口；确定五个前台路由和后台 Lite 菜单；保留现有用户修改，先建立本计划、JSON schema 和 locale key 清单。

### P1：基础内容与运行壳

导入静态 JSON；建立 API client、请求状态组件、统一错误码和 locale key 校验；实现加载/空/失败/重试/成功/过期的通用状态。验收：无新页面硬编码基础内容，无语言/声音/震动设置入口。

### P2：大厅与游戏

完成推荐、游戏列表、筛选、维护/即将上线/地区不可用、启动加载及失败重试。验收：只有服务端返回可用时才能启动，实时字段不由 JSON 伪造。

### P3：活动

完成签到、转盘、任务、奖励记录及幂等模拟适配器/API 接口。验收：结果和领取状态可查询，断网/重复点击不重复发奖。

### P4：商城与我的

完成金币礼包、月卡、明日宝箱、订单与钱包流水、资料/权益/帮助。验收：支付未接入时不显示成功；宝箱结算状态和规则版本可追踪。

### P5：后台

完成仪表盘、游戏、活动、商品、订单、钱包、玩家、发布审核和审计。验收：前台每个动态展示字段都有对应管理/服务端来源，已发布版本不可直接覆盖。

### P6：质量门禁

执行构建、单元/路由/状态/幂等/异常测试；检查 375×812、390×844、768×1024、1440×900；检查中英文 key 完整性、键盘可达性、无赛事死链和无“模拟成功”误导文案。未接入真实支付、游戏引擎和服务端时，标记为待联调，不得宣称生产验收完成。

## 9. 验收清单

- 前台只有大厅、游戏、活动、商城、我的五个入口；赛事及相关入口不存在。
- 静态基础内容由 JSON 导入；动态状态由 API/同构适配器返回，并标记 mock 来源。
- 所有可见文本均使用 locale key；中文/英文 key 数量和插值参数一致；没有语言设置、声音设置或震动设置。
- 游戏、签到、转盘、任务、月卡、明日宝箱和订单覆盖正常、加载、空、失败、重试、处理中、成功、已领取、过期状态。
- 转盘开奖、宝箱结算、支付、资产变更和奖励领取不由前端决定；钱包流水可对账。
- 后台配置有版本、校验、审核、发布/暂停/回滚和审计。
- 构建、自动化测试和代表性尺寸视觉检查有实际记录；真实服务端、支付和游戏引擎联调项单独标为未验证。

## 10. P5 后台交付记录（2026-09-02）

本节记录 P5（后台）本轮的实际交付范围，供二期/三期继续规划时判断"已做/待做"边界。

### 已完成

后台 `client/src/admin/AdminApp.jsx` 改为直接读取前台真实数据源（`client/src/data.js`、`client/src/data/liteContent.json`、`client/src/data/engagementPreview.json`、`client/src/engagement/model.js`），字段与前台一一对应，覆盖以下 12 个可达模块：运营概览、游戏管理、游戏版本发布、赢家与动态、活动管理、签到活动、幸运转盘、每日任务、商品与权益、订单管理、钱包流水、玩家管理、权限与账号。具体：

- 游戏管理：目录、状态、在线人数、热度均来自 `data.js: games[]`；新增"大厅热门推荐"开关对应 `popular` 字段；详情抽屉按 `tags` 是否含 `slots` 展示 `liteContent.json: gameDetails` 的胜率/RTP/中奖区间/最高倍数。
- 赢家与动态：拆成"大厅赢家榜与最近中奖"（复用 `engagement/model.js` 的 `rankings()`，与前台 `WinnersPanel` 同一聚合规则、上限 10）和"明日宝箱幸运榜单"两个标签，取自 `engagementPreview.json` 的 `wins`/`chestOpenings`。
- 签到/转盘/任务：签到页新增七日奖励梯度（对应 `data.js: checkinDays`）；转盘页新增 8 个奖项的概率编辑与实时校验（总和须为 100% 才判定可发布）；任务列表从 `data.js: dailyMissions` 派生，区分任务定义状态（生效中/已过期）与玩家进度。
- 商品与权益：金币礼包 4 档全部对应 `data.js: coinPacks`；月度特权卡对应 `liteContent.json: products.monthlyPass`；新增明日宝箱报价配置卡片（版本号/购买价格/奖励上限/解锁截止规则/幂等键说明），可编辑并"生成新版本"。
- 订单/钱包流水：订单状态扩展为待支付/处理中/已支付/失败/退款处理中/已退款/异常七态，只覆盖金币礼包与月度特权卡（明日宝箱按次扣款，不产生订单记录）；钱包流水改用 `engagementPreview.json: walletLedger` 真实来源分类（chest_purchase/chest_reward/game_reward/game_cost/checkin/task）。
- 游戏版本发布、权限与账号：此前是写好但侧边栏无入口的死代码，本轮确认为合理功能并接回导航，游戏版本发布整合为一个菜单项下的四个标签（版本记录/上传记录/测试环境/生产环境），环境提示文案改为跟随标签本身而非全局环境选择器。
- 清理 `tournaments`/`rooms`/`family`/`settlements`/`redeem`/`tickets`/`analytics`/`risk`/`settings`/`recommend`/`categories`/`roles` 等 14 个无侧边栏入口的旧版赛事/直播/家族相关死数据键。

### 验证记录

`npm run verify`（lint + 60 项测试 + build + check:dist）本轮多次运行，全部通过，构建无警告。本地起 dev server 逐页点击核实 12 个可达页面、详情抽屉、弹窗表单、拖拽排序、概率校验、奖励编辑等交互，过程中发现并修复一个真实 React 状态串味 bug（切换标签/环境时旧数据不刷新）。随后由一个独立于实现的审查视角复核，确认并修复 5 处问题：`待复核` 状态缺少徽标与筛选项、游戏排序草稿未按环境隔离、版本发布页环境提示与所选标签矛盾、赢家榜展示上限未按业务规则硬性限制在 10、赢家榜聚合逻辑改为直接复用 `engagement/model.js` 的 `rankings()` 而非另行实现。修复后重新执行 `npm run verify` 并逐条在浏览器中复核确认生效。

### 明确未完成（二期/三期范围）

- 后台配置无真实版本锁定/审核/回滚机制：所有"保存草稿""发起发布"仅落在本地 React 状态，刷新页面即丢失；验收清单中"已发布版本不可直接覆盖"要求真实服务端持久化才能满足，本轮不涉及。
- 后台无中英文 locale key 体系（用户已确认本阶段不需要）；第 5 节"所有用户可见文本、后台字段都必须有稳定 key"这条尚未覆盖到后台。
- 前台仍保留未接入路由的赛事/直播/家族相关文件（`TournamentsPage.jsx`、`LiveRooms.jsx`、`LiveRoomsTeaser.jsx`、`SocialActivities.jsx`、`data.js` 中的 `liveRooms` 等），用户已确认这是本版本刻意隐藏而非删除的功能，未在本轮处理。
- 真实服务端、支付、游戏引擎、后台鉴权/RBAC 落地均未接入，后台所有数据仍是本地 mock，与第 4 节"动态服务端内容"边界一致。
