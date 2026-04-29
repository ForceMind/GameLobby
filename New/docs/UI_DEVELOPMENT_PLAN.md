# UI 开发计划

本文档定义 UI 重构的执行顺序。当前重点不是加更多功能，而是把移动端和 PC 端拆成两套清晰比例，先解决“比例不像设计图、移动端拥挤、底栏不常驻”的问题。

## 阶段 1：样式架构拆分

新增文件：

```text
src/styles/mobile.css
src/styles/desktop.css
```

修改：

```text
src/App.jsx
```

导入顺序：

```js
import './App.css';
import './styles/mobile.css';
import './styles/desktop.css';
```

这样新文件在旧 `App.css` 后加载，可以覆盖历史混乱媒体查询。

## 阶段 2：移动端 H5 规范

断点：

```text
max-width: 767px
```

核心规则：

- 页面最大宽度：`430px`。
- 390px 视口下左右边距：`10px`。
- 底栏：`position: fixed`，固定底部。
- 内容底部避让：`calc(68px + 安全区 + 30px)`，底栏始终常驻。
- 卡片圆角：`18px` 左右，避免 PC 的大圆角压缩后显得笨重。
- 标题字号：主标题约 `34px`，普通标题约 `22px`，正文约 `14px`。
- 热门游戏：移动端 4 列，卡片做紧凑比例，首屏显示更多内容。
- All Games 二级页：移动端 4 列。
- Shop 商品：移动端 3 列，减少购买卡片占屏高度。
- 快捷入口：5 列，图标约 `44px`，文字约 `11px`。
- 顶部钱包：账号左侧、金币/活动币/通知在右上角；语言切换放到设置二级页；金币余额不显示美元符号。

逐页目标：

- Lobby：首屏能看到顶部、主推、Jackpot、快捷入口和热门游戏标题。
- Tournaments：主赛事卡不撑爆，详情块和列表可读。
- Events：主活动卡和任务列表不出现大面积空白。
- Shop：商品 3 列，价格按钮不溢出。
- Me：统计、资产、成就不一列挤成超大卡，VIP 徽章压缩为移动卡片。
- Admin：手机下能编辑 JSON，不横向撑出。

## 阶段 3：PC 端 Web 规范

断点：

```text
min-width: 768px
```

核心规则：

- 内容宽度：`min(1180px, calc(100vw - 64px))`。
- 底栏：PC 端使用页面底部 sticky，避免大屏截图和长页面中遮挡内容；移动端保持 fixed 常驻。
- 内容底部避让：移动端使用 `env(safe-area-inset-bottom)`，PC 端由底栏自然占位。
- Lobby：Hero + Jackpot 两列，游戏 4 列。
- Tournaments：赛事列表保持横向信息结构。
- Events：任务列表横向结构。
- Shop：商品 4 列，礼包 3 列。
- Me：资产和进度保持多列。

## 阶段 4：底栏常驻

要求：

- 移动端和 PC 端都固定在底部。
- 不遮挡内容。
- iPhone 安全区使用 `env(safe-area-inset-bottom)`。
- 状态标签 `service-pill` 不盖内容，放到底栏上方或页面底部安全位置。

## 阶段 5：截图验收

命令：

```powershell
node .\scripts\capture-screenshots.mjs --out=qa-screens\ui-pass --wait=1800 --port=9350
```

检查文件：

```text
qa-screens/ui-pass/*mobile*.png
qa-screens/ui-pass/*desktop*.png
```

必须检查：

- mobile-lobby
- mobile-tournaments
- mobile-events
- mobile-shop
- mobile-me
- desktop-lobby
- desktop-tournaments
- desktop-admin

## 阶段 6：测试

必须运行：

```powershell
npm run lint
npm run build
powershell -NoProfile -ExecutionPolicy Bypass -File .\一键验收.ps1 -SkipScreenshots -NoPause
```

如需完整截图验收：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\一键验收.ps1 -NoPause
```

## 当前修复记录

- 顶部余额固定在右上角区域，金币余额不显示美元符号。
- Jackpot、赛事奖池、排行榜奖励统一使用“金币”。
- 移动端 Lobby 游戏为 4 列，All Games 二级页为 4 列。
- 移动端 Shop 商品为 3 列。
- Me 页 VIP 徽章在移动端改为紧凑横向卡片。
- `Asset Details`、`Ticket Bonus Balance`、`Wallet` 已拆成不同二级内容。
- 右上角新增语言切换，支持中文和英文。
- 语言切换已移入设置二级页，顶部不再显示语言按钮。
- 游戏记录、成就查看全部、排行榜、奖池、赛事详情、活动详情、商城列表均已改为完整二级页面。
- 设置页移除声音，只保留语言和通知。
- Me 页 VIP 改为等级上方的紧凑条目，点击进入 VIP 规则和权益二级页。
- 大厅默认游戏分类为热门，其他分类为 Slot、休闲、捕鱼。
- 大厅奖池移动端缩为一行，点击进入大奖 Slot 游戏列表。
- 每日奖励移动端一行展示 7 天，二级页包含规则和补签入口。
- 商城顶部分类点击会滚动到对应区域，首页每组移动端展示 3 个，查看更多进入二级页。
- 活动筛选按钮放在分类行最右侧，点击会切换筛选。
- 底栏增加液态玻璃质感，使用实色渐变和内阴影，不依赖真实透明。
- 游戏详情弹层移动端改为紧凑首屏布局，开始按钮移动到游戏参数旁边。
- 赛事页删除无效筛选，进行中/即将开始可切换，详情页补充紧凑玩法说明。
- 活动页调整为“完成任务 -> 获得积分 -> 排名结算”的结构，二级页展示任务、排行榜和排名奖励。
- Me 页 VIP 展示等级、成长值、到期、每日成长和过期衰减，二级页展示各等级奖励领取状态。
- 商城兑换区支持输入兑换码并调用后端 `/api/redeem`。
- Me 页删除安全入口，客服改为标题/内容反馈系统。
- 我的资产改为单行资产汇总，资产二级页展示钱包流水。
- 后台管理页增加运营模块说明，并支持编辑 `vip`、`redeemCodes` 等集合。

后续新增页面时必须同时检查：

- 390px 移动端。
- 768px 附近断点。
- 1440px PC 端。
- 底栏是否遮挡最后一屏内容。
