# cocogames 系统拆解

本文档先把整个项目拆清楚，后续开发必须按模块推进，避免继续在一个页面和一个 CSS 文件里堆功能。

## 1. 产品层

### 1.1 大厅 Lobby

目标：用户进入后第一眼看到账号、金币、主推游戏、奖池、快捷入口、热门游戏、每日奖励、赢家榜。

页面模块：

- 顶部账号区：品牌、头像、昵称、UID、金币、活动道具币、通知。
- 主推区：大 Banner、Play Now。
- Jackpot：奖池总额、触发规则、近期赢家。
- 快捷入口：Daily Bonus、Lucky Wheel、Tournaments、Daily Tasks、Shop。
- 游戏列表：Slot、Casual 分类，支持真实服务器游戏列表。
- 每日奖励：7 日奖励配置。
- Winner Board：本地榜单或真实服务器 APNS 榜单。

数据来源：

- 本地：`GET /api/lobby/bootstrap`。
- 真实：`/game/lobby/login` 返回 WebSocket，`InitRet` 更新用户、金币、游戏；`GetApnsRet` 更新榜单。

### 1.2 赛事 Tournaments

目标：展示赛事列表和详细规则，用户能看到参赛人数、规则、奖励档位、人员状态。

页面模块：

- 页面标题和历史入口。
- Ongoing / Upcoming 切换。
- 筛选按钮。
- 主赛事卡：奖池、倒计时、人数、我的排名、详情按钮。
- 赛事详情块：规则、人员情况。
- 赛事列表：单项赛事、奖池、人数、倒计时。
- How to Play：参与流程。
- 二级弹层：完整规则、允许游戏、奖励档位、赛程。

接口：

- 本地：`GET /api/tournaments`、`GET /api/tournaments/:id`、`POST /api/tournaments/:id/join`。
- 真实：待后端提供 REST 或 protobuf 消息。

### 1.3 活动 Events

目标：活动任务、进度、里程碑、领奖入口。

页面模块：

- 活动主视觉。
- 活动进度与里程碑。
- 活动筛选。
- 活动任务列表。
- 活动详情弹层：任务、里程碑、规则。

接口：

- 本地：`GET /api/events`、`GET /api/events/:id`、`POST /api/events/:id/claim`。
- 真实：待后端提供。

### 1.4 商城 Shop

目标：金币包、活动道具币消耗道具、礼包、兑换。

页面模块：

- Welcome Pack。
- Coins。
- Items。
- Deals。
- 产品详情弹层。

接口：

- 本地：`GET /api/shop/products`、`GET /api/shop/products/:id`、`POST /api/shop/purchase`。
- 真实：待后端提供订单、支付和发货接口。

### 1.5 我的 Me

目标：用户资产、VIP、成就、消息、安全、客服、设置。

页面模块：

- 等级、经验、统计。
- VIP 卡。
- 快捷菜单。
- My Assets。
- My Progress。
- 二级弹层：Wallet、Gifts、Messages、Security、Support、History、Achievements、Settings、VIP。

接口：

- 本地：`GET /api/profile/:section`、`GET /api/profile/wallet`。
- 真实：待后端提供钱包流水、资产明细等接口。

### 1.6 后台 Admin

目标：本地开发阶段可编辑 mock 数据，方便前后端联调。

页面模块：

- 数据集合切换。
- JSON 编辑器。
- 保存当前模块。
- 重置内存数据。
- 接口结构说明。

接口：

- `GET /api/admin/snapshot`
- `GET /api/admin/collections/:name`
- `PUT /api/admin/collections/:name`
- `POST /api/admin/reset`

生产化缺口：登录、权限、审计日志、数据库持久化。

## 2. 技术层

### 2.1 前端

当前入口：

```text
src/App.jsx
```

当前基础样式：

```text
src/App.css
```

新的 UI 拆分：

```text
src/styles/mobile.css
src/styles/desktop.css
```

规则：

- `App.css` 保留组件基础视觉。
- `mobile.css` 只负责 H5 移动端比例、固定底栏、安全区、触摸尺寸。
- `desktop.css` 只负责 PC 宽屏布局、栅格、内容宽度。
- 后续不要继续把移动端和 PC 端混在同一段媒体查询里反复覆盖。

### 2.2 本地后端

入口：

```text
server/index.js
```

数据：

```text
server/mockData.js
```

职责：

- 提供完整本地 mock 数据。
- 提供旧路径兼容接口。
- 提供后台管理读写接口。
- 生产构建后托管 `dist/`。

### 2.3 真实服务器兼容层

入口：

```text
src/server/httpClient.js
src/server/socketClient.js
src/server/player.js
public/proto/lobby.proto
```

已验证链路：

```text
/game/lobby/login -> WebSocket URL -> InitReq -> InitRet -> GetApnsReq -> GetApnsRet
```

## 3. 开发顺序

1. 文档拆解和 UI 规范。
2. 移动端独立比例和固定底栏。
3. PC 端独立宽屏布局。
4. 逐页检查 Lobby、Tournaments、Events、Shop、Me、Admin。
5. 二级弹层检查。
6. 接口文档和数据配置更新。
7. lint、build、一键验收、截图检查。

## 4. 验收标准

- 移动端 390px 宽度不横向溢出。
- 移动端元素尺寸接近设计图，不出现大字体、大卡片挤压。
- 底栏固定在底部，内容底部有足够避让空间。
- PC 端不拉成手机宽度，也不把 H5 卡片无限放大。
- 切换移动端和 PC 端时布局不会断层或互相污染。
- 所有页面和二级弹层可打开。
- `npm run lint` 通过。
- `npm run build` 通过。
- `一键验收.ps1` 通过。
