# cocogames H5 游戏大厅

这是一个可本地部署的完整 H5 游戏大厅项目，包含 React/Vite 前端、Node.js 后端、本地兼容数据、真实服务器 WebSocket/protobuf 接入、后台管理入口和一键启动/验收脚本。

## 当前包含

- 大厅：主推 Banner、奖池、快捷入口、热门游戏、每日奖励、赢家榜。
- 游戏：以 Slot 游戏和 Casual 休闲游戏为主。
- 赛事：赛事列表、规则、人员情况、奖池、排名、奖励档位和详情页。
- 活动：活动任务、进度、里程碑奖励、筛选和排行榜入口。
- 商城：金币包、活动币道具、礼包、VIP、兑换结构。
- 我的：账号资料、钱包、活动币、券奖励余额、VIP、成就、记录、安全、客服等二级页面。
- 多语言：支持英文和中文，右上角可切换，也支持 `?lang=zh` 和 `?lang=en`。
- 响应式：移动端 H5 与 PC 端分别定义样式规则。
- 后端：本地 Node 服务提供 `/api/*` 和兼容旧路径的数据接口。
- 真实服务器：保留并验证 `/game/lobby/login -> WebSocket -> protobuf InitReq/GetApnsReq` 链路。

## 一键启动

安装依赖：

```powershell
npm install
```

脚本已经按平台分目录：

```text
scripts/windows/
scripts/macos/
```

Windows 本地模拟数据模式：

```powershell
.\一键启动.ps1
```

或使用分目录脚本：

```powershell
.\scripts\windows\一键启动.ps1
```

Windows 可双击：

```text
一键启动.bat
```

Mac 本地启动：

```bash
bash scripts/macos/start-local.sh
```

Mac 验收：

```bash
bash scripts/macos/accept.sh --skip-screenshots
```

如果要双击 `.command` 文件，需要先在 Mac 终端执行一次：

```bash
chmod +x scripts/macos/*.sh scripts/macos/*.command
```

生产构建并启动：

```powershell
.\一键启动.ps1 -Mode prod
```

真实账号模式：

```powershell
.\一键启动.ps1 -Mode prod -DataMode real -ApiBaseUrl "https://你的真实服务器地址" -Uid "你的真实UID" -Ig "你的IG"
```

直接访问真实账号地址格式：

```text
http://127.0.0.1:8787/?server=real&preferRemote=1&apiBaseUrl=你的真实服务器地址URL编码&uid=你的真实UID&ig=你的IG
```

中文界面地址示例：

```text
http://127.0.0.1:8787/?server=local&lang=zh
```

后台管理入口：

```text
http://127.0.0.1:8787/?admin=1
```

## 一键验收

```powershell
.\一键验收.ps1
```

验收内容：

- `npm run lint`
- `npm run build`
- 启动或复用本地后端
- 检查核心 API
- 生成移动端和 PC 截图到 `qa-screens/`

快速验收不截图：

```powershell
.\一键验收.ps1 -SkipScreenshots -NoPause
```

Mac 快速验收：

```bash
bash scripts/macos/accept.sh --skip-screenshots --no-pause
```

## 常用命令

```powershell
npm run dev          # 启动 Vite 前端
npm run dev:server   # 启动 Node 后端
npm run build        # 构建前端
npm start            # 运行一体化生产服务
npm run lint         # 代码检查
```

默认地址：

- 前端开发服务：`http://localhost:5173`
- 后端和生产服务：`http://127.0.0.1:8787`
- 健康检查：`http://127.0.0.1:8787/api/health`

## 货币规则

只允许两类余额字段：

- `coins`：金币，主货币。
- `eventCoins`：活动币，可用于活动道具、任务、兑换等。

账号余额、奖池、赛事奖金、奖励展示都不能使用 `$`。商城里的 `$1.99`、`$4.99` 等是现实支付价格，不属于金币余额。

不要新增或命名为 `diamond`、`gem`、`jewel`、钻石、宝石等字段。

## 关键实现说明

- 顶部余额：在 `src/App.jsx` 的 `TopBar` 中渲染，样式由 `src/styles/mobile.css` 和 `src/styles/desktop.css` 控制。
- 多语言：文案集中在 `src/App.jsx` 的 `messages`，新增语言时扩展同名 key。
- 移动端网格：热门游戏和 All Games 为 4 列，Shop 商品为 3 列。
- WebSocket：`src/server/index.js` 注册连接器，`httpClient` 收到真实登录返回的 `ws/wss` 地址后调用连接器，不再动态导入 `socketClient`。
- protobuf：`vite.config.js` 将 `@protobufjs/inquire` 指向 CommonJS 浏览器安全探测模块，避免打包第三方 eval 探测代码，同时避免 `util.inquire is not a function` 白屏。
- 截图目录：`eslint.config.js` 忽略 `qa-screens/**`，防止 Chrome 临时目录被 lint 扫描。

## 文档索引

- API 合同：`docs/API.md`
- 后端模块：`docs/BACKEND_MODULES.md`
- 数据配置：`docs/DATA_CONFIG.md`
- 部署说明：`docs/DEPLOYMENT.md`
- 系统拆解：`docs/SYSTEM_DECOMPOSITION.md`
- UI 计划：`docs/UI_DEVELOPMENT_PLAN.md`
- 真实服务器登录：`docs/REAL_SERVER_LOGIN.md`
- 真实服务器联调报告：`docs/REAL_SERVER_INTEGRATION_REPORT.md`
- 维护说明：`docs/MAINTENANCE.md`
- 剩余生产化工作：`docs/REMAINING_WORK.md`
