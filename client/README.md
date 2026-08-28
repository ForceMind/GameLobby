# Joyloop 内嵌 H5 v0.2.1 高保真原型

这是 Joyloop 游戏大厅的 React + Vite 静态前端，面向内置在 App 中的 H5，也可独立作为 Cloudflare Pages 静态站点预览。当前代码不连接真实数据库、鉴权、游戏引擎或支付服务；宿主接入方式见 [HOST-INTEGRATION.md](HOST-INTEGRATION.md)。

## 页面入口

Vite 会生成七个入口：`index.html`（根入口别名）、`lobby.html`、`games.html`、`tournaments.html`、`events.html`、`store.html` 和 `profile.html`。生产输出位于 `dist/`。

## 进入与游戏流程

直接打开任意入口即可查看完整产品界面，没有说明页、勾选同意或缩放控件。布局由承载容器配置：默认填满当前视口，`?mode=half` 可用于 1:1 嵌入预览，边长为 `min(viewportWidth, viewportHeight, 640px)`。`mode` 是展示环境参数，不是用户操作流程。有效的 `mode` 随内部页面链接保留，不依赖浏览器存储；当前会话也使用 `joyloop.h5-layout.v1` 保存布局配置，旧版本同意状态不再读取。CSS 只能使用宿主分配的视口；真实容器扩展由原生 App 配合。

点击可进入游戏后，页面先切换到全屏加载状态。加载中左上角显示 `Lobby` 返回按钮；进入游戏后该按钮消失，游戏自己的关闭按钮固定在右上角。关闭游戏会请求宿主恢复进入前的大厅模式。仓库内游戏画面是本地交互流程，不是实际游戏引擎或实时对局。

页面使用当前 App 账号，不提供独立登录或退出登录；账号身份和注销由 App 管理。宿主可注入公共 `account` 与 `wallet`，或通过 `joyloop:context` 事件更新。

## 语言与资产

金币、宝石及个人页资产卡均原地打开余额与最近变动浮窗，关闭不改变页面或滚动位置，不附加充值“+”按钮。主导航和明确的内容入口才进行页面跳转；详情、规则、表单和游戏操作不转回首页。

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
