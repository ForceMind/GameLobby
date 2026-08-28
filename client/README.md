# Joyloop 内嵌 H5 v0.2.0

这是 Joyloop 游戏大厅的 React + Vite 静态前端，面向内置在 App 中的 H5，也可独立作为 Cloudflare Pages 静态站点预览。当前代码不连接真实数据库、鉴权、游戏引擎或支付服务；宿主接入方式见 [HOST-INTEGRATION.md](HOST-INTEGRATION.md)。

## 页面入口

Vite 会生成七个入口：`index.html`（根入口别名）、`lobby.html`、`games.html`、`tournaments.html`、`events.html`、`store.html` 和 `profile.html`。生产输出位于 `dist/`。

## 进入与游戏流程

首次进入先显示说明页。用户选择打开方式并同意后进入大厅；默认模式是半屏 1:1 方形窗口，边长为 `min(viewportWidth, viewportHeight, 640px)`，也可切换全屏。CSS 只能填充宿主已经分配的视口，不能越出小 WebView；真实容器扩展需原生 App 配合桥接调整。

点击可进入游戏后，页面先切换到全屏加载状态。加载中左上角显示 `Lobby` 返回按钮；进入游戏后该按钮消失，游戏自己的关闭按钮固定在右上角。关闭游戏会请求宿主恢复进入前的大厅模式。仓库内游戏画面是本地交互流程，不是实际游戏引擎或实时对局。

页面使用当前 App 账号，不提供独立登录或退出登录；账号身份和注销由 App 管理。宿主可注入公共 `account` 与 `wallet`，或通过 `joyloop:context` 事件更新。

## 语言与资产

正式支持 `zh`（简体中文）和 `en`（英文）。商城统一使用美元：`1 USD = 10,000 金币`。当前静态礼包配置如下：

|    金币 | 折扣 |   原价 | 折后价 |
| ------: | ---: | -----: | -----: |
|   6,000 |   8% |  $0.60 |  $0.55 |
|  30,000 |  18% |  $3.00 |  $2.46 |
|  68,000 |  28% |  $6.80 |  $4.90 |
| 128,000 |  40% | $12.80 |  $7.68 |

折扣档位属于业务最终确认前的静态配置；折扣不增加金币数量，宝石赠礼是独立字段。购买按钮进入确认页，再通过宿主 `purchase` 请求处理；宿主未接入时不会显示购买成功。

## 本地运行、验证与打包

使用 Node.js 22.12 或更新版本（`.nvmrc` 选择 Node 22）：

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run verify
npm run package:pages
```

打包脚本在仓库根目录 `artifacts/` 生成 ZIP、`.sha256` 和 manifest；正式包应来自干净提交，manifest 的 `dirty` 应为 `false`。不要直接双击 HTML，请通过本地 HTTP 预览。

## Cloudflare Pages

Git 集成设置：Root directory=`client`，Build command=`npm run build`，Build output directory=`dist`。直接上传见 [DEPLOY-CF-PAGES.md](DEPLOY-CF-PAGES.md)。`public/_headers` 会随构建复制到 `dist/_headers`。

当前 `_headers` 使用 `SAMEORIGIN`，允许顶层原生 WebView 和同源 iframe；跨源 iframe 需另行明确允许域名、CSP 与宿主策略。

## 维护位置

| 范围               | 位置                                            |
| ------------------ | ----------------------------------------------- |
| 页面与 H5 外壳     | `src/pages/`、`src/App.jsx`、`src/h5/`          |
| 游戏目录与本地流程 | `src/GameCatalog.jsx`、`src/h5/GameSession.jsx` |
| 语言与产品文案     | `src/i18n.js`、`src/locales/`                   |
| 静态规则与单元测试 | `src/demoModel.js`、`src/*.test.js`             |
| 构建、检查与打包   | `scripts/`                                      |
