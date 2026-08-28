# Joyloop 静态网页 v0.1.0

这是 Joyloop 游戏大厅的 React + Vite 静态交互原型。当前版本使用前端演示数据，不连接后端、数据库、鉴权、游戏引擎或真实支付，目标是先验证页面结构、视觉方向与基础交互，并可部署到 Cloudflare Pages。

## 页面入口

应用包含六个真实 HTML 页面入口，主导航保持五项：

- `lobby.html`：游戏大厅
- `games.html`：全部游戏（大厅子页，完整目录与组合筛选）
- `tournaments.html`：赛事中心（页面标识为 `tournaments`）
- `events.html`：活动中心
- `store.html`：金币商城
- `profile.html`：个人中心

站点根路径 `/` 对应 `index.html`，作为大厅入口别名；Vite 会将上述页面及根入口一起输出到 `dist/`。

页面中的资产名称统一为「金币」和「宝石」。余额和全站人数固定；签到、任务、抽奖、报名/候补、兑换码、商城记录、昵称、访客状态和设置开关只提供本页反馈，刷新或切换页面后会重置；操作不产生真实订单、扣款或到账。语言偏好例外：它通过 URL 和可用时的浏览器本地存储保留。

本版已吸收 `joyloop.zip` 的调整：大厅默认四款热门游戏，完整八款移入独立目录；活动总览可跳转到签到、转盘和每日任务。活动页的奖励记录仅保存在当前页内存中，不是服务端账单。

## 语言与交互

- 正式提供 `zh`（简体中文）和 `en`（英文），顶部语言选择器与个人中心均可切换；也可直接访问 `lobby.html?lang=en`。
- 所有页面、弹窗、表单、反馈、数据标签和无障碍标签均接入当前翻译目录。动态数量使用完整模板；内链保留语言、分类与锚点。
- 英文金额明确标注 CNY，不做汇率转换。Joyloop、游戏名称、英文品牌标语和页面装饰性英文分类标题保持专名。
- 旧版五语文件已归档到 `src/legacy/i18n.js`，不参与运行；西语、葡语、菲律宾语不显示为已可用选项。
- 榜单、规则、战绩和安全状态有内容详情；昵称支持本页编辑；退出与恢复、报名/候补、兑换码均有明确状态结果。

## 本地运行

使用 Node.js 22.12 或更新版本（`.nvmrc` 选择 Node 22），在 `client` 目录执行：

```bash
npm ci
npm run dev
```

构建生产文件并本地预览：

```bash
npm run build
npm run preview
```

构建产物位于 `client/dist/`。

代码检查、交互规则测试、生产构建与静态入口校验可一次运行：

```bash
npm run verify
```

生成直接上传用的压缩包（包含完整验证与构建）：

```bash
npm run package:pages
```

产物位于仓库根 `artifacts/`，包括 `.zip`、`.zip.sha256`、`.zip.manifest.json`。清单记录源提交、工作区是否有未提交改动和每个文件的校验值。正式交付包应在干净提交上生成，`dirty` 必须为 `false`。

请通过本地 HTTP 预览或静态托管访问，而不是直接双击 HTML；浏览器会限制 `file://` 下的模块脚本加载。

## Cloudflare Pages

连接 Git 仓库时使用以下设置：

| 设置 | 值 |
| --- | --- |
| Root directory | `client` |
| Build command | `npm run build` |
| Build output directory | `dist` |

也可以先在本地执行构建，再将 `client/dist` 目录作为静态产物上传。`client/public/_headers` 会随构建复制到输出目录，用于基础响应头与缓存策略。Pages 对 React/Vite 的官方构建配置是 `npm run build` 与 `dist`：[Cloudflare Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)。

当前响应头默认禁止第三方 iframe 嵌入。若后续需要嵌入宿主站点，应先确认允许的宿主域名，再调整 `X-Frame-Options` / CSP；这不影响直接浏览或 WebView 加载。

## 当前边界

这是可部署的浅色、自包含重建版本，重点是入口、布局、状态反馈和原型交互演示。正式版本仍需补齐身份认证、服务端数据校验、支付与风控、游戏启动、赛事规则与结算、资产账本、持久化及错误恢复；本任务要求是得到可部署的静态网页，不代表已经发布或完成线上接入。

两个原型包都未包含引用的样式、脚本、图标和游戏封面。当前版本已提供自包含 CSS、图标、八组代码原生 SVG 主题插画和品牌图标，部署不依赖这些缺失文件；但无法据此声称与原型最终美术逐像素一致。评审与待确认规则见 [静态原型评审](../plans/joyloop_static_review.md)，操作范围及验证证据见 [QA.md](QA.md)。

## 维护位置

| 范围 | 位置 |
| --- | --- |
| 页面与共享外壳 | `src/pages/`、`src/App.jsx`、`src/ui.jsx` |
| 游戏目录与插画 | `src/GameCatalog.jsx`、`src/GameIllustration.jsx` |
| 语言与文案 | `src/LocaleProvider.jsx`、`src/i18n.js`、`src/locales/` |
| 演示规则与单元测试 | `src/demoModel.js`、`src/*.test.js` |
| 静态文件检查与打包 | `scripts/check-dist.mjs`、`scripts/package-pages.mjs` |
