# 维护说明

本文档记录当前项目中容易误改的实现点，后续程序员接接口或改 UI 前应先阅读。

## 1. 金币不是美元

前端统一通过 `src/App.jsx` 的 `coinAmount(value, t)` 展示金币数值。

适用范围：

- 顶部账号余额
- Jackpot 奖池
- 赛事奖池
- 排行榜奖励
- Jackpot 最近赢家金额

这些位置不能加 `$`。商城商品价格可以继续使用 `$4.99` 这类真实支付价格。

## 2. 多语言维护

多语言文案集中在：

```text
src/App.jsx -> messages
```

当前支持：

- `en`
- `zh`

切换方式：

```text
我的 -> 设置 -> 语言
?lang=zh
?lang=en
```

新增页面时，不要直接把固定中文或英文散落在 JSX 中。先在 `messages.en` 和 `messages.zh` 增加 key，再通过 `t('key')` 使用。

## 3. 移动端和 PC 端样式边界

样式入口顺序：

```js
import './App.css';
import './styles/mobile.css';
import './styles/desktop.css';
```

维护规则：

- 公共视觉基础放在 `src/App.css`。
- 移动端专属比例放在 `src/styles/mobile.css`。
- PC 端布局放在 `src/styles/desktop.css`。
- 不要在 `App.css` 末尾继续增加新的移动端覆盖，否则会再次造成 PC/移动切换错位。

当前移动端规范：

- 顶部账号左侧，金币/活动币/通知在右上角。
- 语言切换只能放在设置页。
- Lobby 游戏 4 列。
- All Games 二级页 4 列。
- Shop 商品 3 列。
- 每日奖励 7 天一行。
- 我的进度移动端 3 列。
- 底栏固定底部，内容区必须预留底部空间。
- 底栏液态玻璃效果是实色渐变和内阴影，不要改成真实透明，否则复杂背景上会读不清。
- 游戏详情移动端必须保持开始按钮在首屏内，不要把按钮重新放到底部。

## 4. 我的页面二级页

这些入口不能共用同一个模板。

当前实现：

```text
src/App.jsx -> renderSubPage() -> profileSection
```

- `assets`：资产汇总和钱包流水记录。
- `bonus`：券奖励余额、奖励来源列表。
- `wallet`：钱包余额、交易流水。
- `support`：反馈表单和反馈记录，不再是普通客服列表。
- `history`：完整游戏记录页，不再使用浮窗。
- `achievements`：完整成就页，不再使用浮窗。
- `settings`：语言、通知；声音已移除。
- `vip`：VIP 等级、成长值、到期、衰减规则、各等级奖励领取。

后端接入时建议分别提供：

```text
GET /api/profile/wallet
GET /api/profile/assets
GET /api/profile/bonus-balance
GET /api/profile/history
GET /api/profile/achievements
GET /api/profile/settings
GET /api/profile/vip
POST /api/profile/feedback
POST /api/profile/vip/reward
```

## 5. 活动和赛事业务规则

活动不是简单领奖列表。当前前端按以下结构展示：

```text
完成任务 -> 增加活动积分 -> 进入活动排行榜 -> 活动结束按 rankRewards 结算
```

后端接口：

```text
POST /api/events/:id/missions/:missionId/complete
GET /api/events/:id/ranking
```

赛事页使用 `status` 区分：

```text
ongoing
upcoming
```

`upcoming` 必须提供 `startsIn`，前端“即将开始”页签会直接读取这个字段。

## 6. WebSocket 连接器

真实服务器登录接口 `/game/lobby/login` 返回的是 `ws/wss` 地址。HTTP 客户端收到这个地址后会调用已注册的 WebSocket 连接器。

当前结构：

```text
src/server/httpClient.js       # 发现 ws/wss 地址
src/server/index.js            # 注册 setWebSocketConnector
src/server/socketClient.js     # 建立连接、发送 InitReq/GetApnsReq
```

不要在 `httpClient.js` 里动态 import `socketClient.js`。这样会造成 Vite 动静态混用警告，也会让依赖关系变得不清晰。

## 7. protobuf 打包说明

`protobufjs` 会探测 Node 模块，默认实现包含 eval-based require。浏览器构建不需要 Node 的 `fs` 和 `buffer`，但需要保留 `long` 支持。

当前处理：

```text
vite.config.js -> resolve.alias['@protobufjs/inquire']
src/proto/protobufInquireBrowser.cjs
```

这个别名的目的：

- 避免打包第三方 eval 探测代码。
- 保留 `long` 模块，减少 64 位数字解析风险。
- 明确浏览器环境不提供 `fs` 和 `buffer`。
- 这个文件必须是 CommonJS `.cjs`。`protobufjs` 内部用 `require('@protobufjs/inquire')`，如果改成 ESM 默认导出，会出现 `util.inquire is not a function` 并导致白屏。

## 8. 截图目录和 lint

截图脚本会临时创建 Chrome 用户目录：

```text
qa-screens/**/.tmp-chrome-*
```

如果脚本异常退出，临时目录可能残留。`eslint.config.js` 已忽略 `qa-screens/**`，避免 lint 扫描 Chrome 扩展文件导致误报。

## 9. 验收要求

每次改 UI、接接口或调整构建配置后至少运行：

```powershell
npm run lint
npm run build
.\一键验收.ps1 -SkipScreenshots -NoPause
```

涉及移动端或 PC 端视觉时，再运行：

```powershell
node .\scripts\capture-screenshots.mjs --pages=lobby,tournaments,events,shop,me --out=qa-screens\manual-check --wait=1800 --port=9350
```

## 10. 跨平台脚本

平台脚本分目录维护：

```text
scripts/windows/
scripts/macos/
```

Windows：

```powershell
.\scripts\windows\一键启动.ps1
.\scripts\windows\一键验收.ps1 -SkipScreenshots -NoPause
```

Mac：

```bash
bash scripts/macos/start-local.sh
bash scripts/macos/accept.sh --skip-screenshots --no-pause
```

如果要在 Finder 双击 `.command` 文件，需要在 Mac 上先执行：

```bash
chmod +x scripts/macos/*.sh scripts/macos/*.command
```
