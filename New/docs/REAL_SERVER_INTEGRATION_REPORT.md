# 真实服务器联调报告

验证日期：2026-04-28。

## 结论

真实服务器接入没有被删除，且已经验证可用。当前可用链路是：

```text
/game/lobby/login -> WebSocket URL -> protobuf InitReq/GetApnsReq -> InitRet/GetApnsRet
```

前端真实模式现在不再错误调用 `/game/lobby/InitReq` 这类 REST 地址，而是只通过登录接口拿 WebSocket，再用现有 protobuf 客户端接收真实大厅数据。

## 本次验证参数

```text
API：你的真实服务器地址
UID：你的真实 UID
ig：你的 IG
room：空
roomType：空
```

完整 UID 未写入文档和报告文件。需要复测时通过脚本参数或一键启动脚本交互输入。

## Node 链路探测结果

命令：

```powershell
node .\scripts\probe-real-server.mjs --uid=你的真实UID --ig=你的IG --out=docs\REAL_SERVER_WS_PROBE.json
```

结果摘要：

```json
{
  "loginStatus": 200,
  "websocketReturned": true,
  "actions": ["InitRet", "GetApnsRet"],
  "summary": {
    "user": {
      "nickname": "DemoGame",
      "token": 84878
    },
    "gameCount": 27,
    "apnsCount": 20
  }
}
```

真实游戏列表前几项：

```text
fish
Bingo
Charmed
Billionaire
FruitSpin 3
JetSet 3
Vegas 3
Tiger 3
```

报告文件：

```text
docs/REAL_SERVER_WS_PROBE.json
```

## 浏览器验证结果

浏览器真实模式地址格式：

```text
http://127.0.0.1:8787/?server=real&preferRemote=1&apiBaseUrl=你的真实服务器地址URL编码&uid=你的真实UID&ig=你的IG
```

验证摘要：

```json
{
  "title": "cocogames",
  "service": "existing-server-ws",
  "brand": "cocogames",
  "playerLine": "DemoGame - ID: <uid>",
  "wallets": ["84,878", "420"],
  "games": ["fish", "Bingo", "Charmed", "Billionaire", "FruitSpin 3", "JetSet 3", "Vegas 3", "Tiger 3"],
  "hasBlank": false
}
```

报告和截图：

```text
docs/REAL_BROWSER_PROBE.json
qa-screens/real-mobile-lobby.png
```

## REST 探测结果

除 `/game/lobby/login` 外，以下 REST 地址当前都不是可用业务数据源。它们返回 HTTP 200，但 body 是业务 404：

```json
{
  "success": 0,
  "status": 404,
  "message": "Whoops, looks like something went wrong."
}
```

已确认包括：

```text
/game/list
/user/profile
/user/balance
/arena/list
/activity/list
/activity/tasks
/store/products
/leaderboard/winners
/ws/token
```

因此后续不要假设真实服务器已经提供这些 REST 数据。真实赛事、活动、商城、钱包流水若要接线上数据，需要服务器补充接口或 protobuf 消息定义。

## 前端改动点

```text
src/server/httpClient.js
```

- 增加 `serverMode`，支持 `server=local` 和 `server=real`。
- 兼容真实服务器返回 HTTP 200 但业务 `success=0,status=404` 的错误形式。
- `server=local` 会强制使用本地兼容服务，避免历史 localStorage 把页面带回真实模式。
- 收到 `/game/lobby/login` 返回的 `ws/wss` 地址后，通过注册的 WebSocket connector 建连，不再动态导入 `socketClient`。

```text
src/server/index.js
```

- 统一导出 HTTP、WebSocket、playerStore。
- 调用 `setWebSocketConnector((url) => socketClient.connect(url))`，让 HTTP 登录结果和 WebSocket 客户端解耦。

```text
src/server/socketClient.js
```

- 真实登录已返回 WebSocket URL 时，不再请求 `/ws/token`。
- WebSocket 打开后发送 `InitReq`。
- 收到 `InitRet` 后写入 `playerStore`，再发送 `GetApnsReq`。
- 兼容浏览器 `Blob.arrayBuffer()` 和 Node `ArrayBuffer` 数据。

```text
src/App.jsx
```

- 真实模式只调用 `/game/lobby/login`。
- UI 状态显示为 `existing-server-ws`。
- 用户、金币、游戏列表和榜单由 WebSocket 事件更新。
- 金币展示统一不使用美元符号，商城真实支付价格除外。
- 多语言支持中文和英文，可通过右上角按钮或 `?lang=zh` 切换。

```text
src/App.css
```

- 修复移动端底部导航遮挡内容。
- 修复真实 UID 太长导致顶部信息行错位。
- 清理 Jackpot 宝箱占位文字。

```text
vite.config.js
src/proto/protobufInquireBrowser.cjs
```

- 浏览器构建为 `@protobufjs/inquire` 提供安全别名，避免打包第三方 eval 探测逻辑。
- 保留 `long` 模块支持，降低 protobuf 64 位字段解析风险。
- 该别名文件必须保持 CommonJS 导出，否则 `protobufjs` 的 CommonJS `require()` 会拿不到函数，页面会白屏并报 `util.inquire is not a function`。

```text
scripts/probe-real-server.mjs
```

- 新增真实服务器 WebSocket/protobuf 探测脚本。
- 写入报告时自动脱敏 UID。

## 还需要真实后端配合的内容

当前真实服务器已经能提供大厅用户、金币、游戏列表、游戏启动 URL 和 APNS 榜单。以下模块还没有真实线上数据源：

- 赛事列表、赛事详情、报名、排行、结算、派奖。
- 活动列表、任务进度、里程碑、领奖、签到、转盘。
- 商城商品、订单、支付回调、发货、兑换码。
- 钱包流水、资产明细、奖励余额明细。
- 后台管理的生产鉴权、审计日志和数据库持久化。

在真实后端接口补齐前，本项目通过本地 Node 服务提供兼容数据，保证完整页面可部署、可演示、可继续开发。
