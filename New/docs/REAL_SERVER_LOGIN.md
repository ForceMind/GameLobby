# 真实服务器账号登录说明

现有服务器接入没有被删除。前端仍保留并使用以下代码：

```text
src/server/httpClient.js
src/server/socketClient.js
src/server/player.js
public/proto/lobby.proto
```

默认真实服务器地址：

```text
https://你的真实服务器地址
```

## 已验证结论

验证日期：2026-04-28。

本次使用真实账号参数验证后，真实服务器的大厅数据链路是：

1. 浏览器或前端请求 `GET /game/lobby/login?uid=...&room=...&ig=...`。
2. 该接口返回一段 `ws://` 或 `wss://` 地址文本，不是 JSON。
3. 前端连接该 WebSocket。
4. 前端通过 protobuf 发送 `InitReq`。
5. 服务器返回 `InitRet`，包含用户、金币余额、真实游戏列表和游戏启动 URL。
6. 前端发送 `GetApnsReq { gid: 0 }`。
7. 服务器返回 `GetApnsRet`，当前可作为 Winner Board / 公告榜单数据来源。

已验证返回：

```text
用户昵称：DemoGame
金币 token：84,878
真实游戏数量：27
榜单/公告数量：20
页面服务状态：existing-server-ws
```

注意：本次文档不保存完整 UID。完整 UID 请通过脚本交互输入，或仅在本机命令行临时传参。

## 一键脚本登录

推荐直接运行：

```powershell
.\一键启动.ps1
```

脚本会询问：

```text
请选择数据模式：
1. 本地模拟数据
2. 真实服务器账号
```

选择 `2` 后填写：

```text
API 地址：https://你的真实服务器地址
UID：你的真实 UID
room：没有就直接回车
roomType/type：没有就直接回车
ig：你的 IG
```

生产模式直接传参：

```powershell
.\一键启动.ps1 -Mode prod -DataMode real -ApiBaseUrl "https://你的真实服务器地址" -Uid "你的真实UID" -Ig "你的IG"
```

开发模式直接传参：

```powershell
.\一键启动.ps1 -Mode dev -DataMode real -ApiBaseUrl "https://你的真实服务器地址" -Uid "你的真实UID" -Ig "你的IG"
```

## 地址拼写格式

生产模式地址：

```text
http://127.0.0.1:8787/?server=real&preferRemote=1&apiBaseUrl=你的真实服务器地址URL编码&uid=你的真实UID&room=&roomType=&ig=你的IG
```

开发模式地址：

```text
http://localhost:5173/?server=real&preferRemote=1&apiBaseUrl=你的真实服务器地址URL编码&uid=你的真实UID&room=&roomType=&ig=你的IG
```

参数说明：

- `server=real`：强制真实服务器模式。
- `preferRemote=1`：优先接真实服务器，不先取本地 mock。
- `apiBaseUrl`：真实服务器 API 根地址，建议在 URL 中编码。
- `uid`：真实账号 ID。
- `room`：房间号，没有可留空。
- `roomType`：旧接口里的 `type`，没有可留空。
- `ig`：现有服务器参数，如果真实服务器需要则填写。

## 本地模拟模式地址

开发模式：

```text
http://localhost:5173/?server=local
```

生产模式：

```text
http://127.0.0.1:8787/?server=local
```

## 真实服务器 REST 现状

已探测的 REST 结果：

```text
GET /game/lobby/login    返回 WebSocket 地址，状态 200
GET /game/list           HTTP 200，但业务返回 success=0,status=404
GET /user/profile        HTTP 200，但业务返回 success=0,status=404
GET /user/balance        HTTP 200，但业务返回 success=0,status=404
GET /arena/list          HTTP 200，但业务返回 success=0,status=404
GET /activity/list       HTTP 200，但业务返回 success=0,status=404
GET /store/products      HTTP 200，但业务返回 success=0,status=404
GET /leaderboard/winners HTTP 200，但业务返回 success=0,status=404
GET /ws/token            HTTP 200，但业务返回 success=0,status=404
```

因此真实服务器模式不能按 REST 拆接口直接读取大厅数据，必须以 `/game/lobby/login` 返回的 WebSocket 为主。

当前前端处理方式：

- 真实模式：只调用 `/game/lobby/login`，拿到 WebSocket 后通过 protobuf 接 `InitRet` 和 `GetApnsRet`。
- 本地模式：使用本地 Node 后端提供赛事、活动、商城、我的页面、后台管理等完整 mock 数据。
- 自动兜底：真实服务器缺少赛事、活动、商城等数据时，UI 不白屏，继续使用本地兼容数据结构。

## 联调检查脚本

只验证真实服务器 WebSocket/protobuf 链路：

```powershell
node .\scripts\probe-real-server.mjs --uid=你的真实UID --ig=你的IG --out=docs\REAL_SERVER_WS_PROBE.json
```

报告会自动脱敏 UID。输出文件：

```text
docs/REAL_SERVER_WS_PROBE.json
```

浏览器验证报告：

```text
docs/REAL_BROWSER_PROBE.json
qa-screens/real-mobile-lobby.png
```

## 程序员继续对接的位置

真实服务器字段进入 UI 的主要映射位置：

```text
src/App.jsx -> normalizeRemoteLobbyData
src/server/player.js
src/server/socketClient.js
```

如果服务器后续增加赛事、活动、商城、钱包流水等 protobuf 消息或 REST 接口，应在这些位置补字段映射，并同步更新：

```text
docs/BACKEND_MODULES.md
docs/DATA_CONFIG.md
docs/REAL_SERVER_INTEGRATION_REPORT.md
```
